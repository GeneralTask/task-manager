package api

import (
	"context"
	"log"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskModifyParams struct {
	IDOrdering    *int       `json:"id_ordering"`
	IDTaskSection *string    `json:"id_task_section"`
	IsCompleted   *bool      `json:"is_completed"`
	Title         *string    `json:"title"`
	Body          *string    `json:"body"`
	DueDate       *time.Time `json:"due_date"`
	TimeDuration  *int       `json:"time_duration"`
}

// using a separate struct with omitempty so that other task fields are not overwritten
type UpdateParams struct {
	Title          string             `bson:"title,omitempty"`
	Body           string             `bson:"body,omitempty"`
	DueDate        primitive.DateTime `bson:"due_date,omitempty"`
	TimeAllocation int64              `bson:"time_allocated,omitempty"`
	IsCompleted    bool               `bson:"is_completed,omitempty"`
}

func (api *API) TaskModify(c *gin.Context) {
	taskIDHex := c.Param("task_id")
	taskID, err := primitive.ObjectIDFromHex(taskIDHex)
	if err != nil {
		// This means the task ID is improperly formatted
		Handle404(c)
		return
	}
	var modifyParams TaskModifyParams
	err = c.BindJSON(&modifyParams)

	if err != nil {
		c.JSON(400, gin.H{"detail": "Parameter missing or malformatted"})
		return
	}

	if modifyParams.IDTaskSection != nil {
		IDTaskSection, err := primitive.ObjectIDFromHex(*modifyParams.IDTaskSection)
		if err != nil || (IDTaskSection != constants.IDTaskSectionToday && IDTaskSection != constants.IDTaskSectionBlocked && IDTaskSection != constants.IDTaskSectionBacklog) {
			c.JSON(400, gin.H{"detail": "'id_task_section' is not a valid ID"})
			return
		}
	}

	isEditingFields := modifyParams.Title != nil ||
		modifyParams.Body != nil ||
		modifyParams.DueDate != nil ||
		modifyParams.TimeDuration != nil

	isMarkingComplete := modifyParams.IsCompleted != nil

	isReordering := modifyParams.IDOrdering != nil || modifyParams.IDTaskSection != nil

	actionCount := 0
	if isEditingFields {
		actionCount++
	}
	if isMarkingComplete {
		actionCount++
	}
	if isReordering {
		actionCount++
	}

	if actionCount == 0 {
		c.JSON(400, gin.H{"detail": "Parameter missing"})
		return
	} else if actionCount > 1 {
		c.JSON(400, gin.H{"detail": "Cannot reorder, mark as complete, or edit fields in the same request"})
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	task, err := GetTask(api, c, taskID, userID)
	if err != nil {
		// status is handled in GetTask
		return
	}

	updateParams := &UpdateParams{}

	isValid := true
	if isReordering {
		ReOrderTask(c, taskID, userID, modifyParams.IDOrdering, modifyParams.IDTaskSection, task)
		return
	}
	if isMarkingComplete {
		isValid = MarkTaskComplete(api, c, taskID, userID, updateParams, task, modifyParams.IsCompleted)
	} else if isEditingFields {
		if modifyParams.Title != nil {
			isValid = isValid && UpdateTaskTitle(api, c, taskID, userID, updateParams, modifyParams.Title)
		}
		if modifyParams.Body != nil {
			isValid = isValid && UpdateTaskBody(api, c, taskID, userID, updateParams, modifyParams.Body)
		}
		if modifyParams.DueDate != nil {
			isValid = isValid && UpdateTaskDueDate(api, c, taskID, userID, updateParams, modifyParams.DueDate)
		}
		if modifyParams.TimeDuration != nil {
			isValid = isValid && UpdateTaskTimeDuration(api, c, taskID, userID, updateParams, *modifyParams.TimeDuration)
		}
	} else {
		c.JSON(400, gin.H{"detail": "Parameter missing or malformatted"})
		return
	}
	if !isValid {
		// if isValid is false, then a json response has already been set
		return
	}

	UpdateTask(api, c, taskID, userID, updateParams, task)
}

func ReOrderTask(c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, IDOrdering *int, IDTaskSectionHex *string, task *database.Task) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)
	updateParams := bson.M{"has_been_reordered": true}
	if IDOrdering != nil {
		updateParams["id_ordering"] = *IDOrdering
	}
	var IDTaskSection primitive.ObjectID
	if IDTaskSectionHex != nil {
		IDTaskSection, _ = primitive.ObjectIDFromHex(*IDTaskSectionHex)
		updateParams["id_task_section"] = IDTaskSection
	} else {
		IDTaskSection = task.IDTaskSection
	}
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	result, err := taskCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": taskID},
			{"user_id": userID},
		}},
		bson.M{"$set": updateParams},
	)
	if err != nil {
		log.Printf("failed to update task in db: %v", err)
		Handle500(c)
		return
	}
	if result.MatchedCount != 1 {
		Handle404(c)
		return
	}
	// Move back other tasks to ensure ordering is preserved (gaps are removed in GET task list)
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = taskCollection.UpdateMany(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": bson.M{"$ne": taskID}},
			{"id_ordering": bson.M{"$gte": IDOrdering}},
			{"id_task_section": IDTaskSection},
			{"user_id": userID},
		}},
		bson.M{"$inc": bson.M{"id_ordering": 1}},
	)
	if err != nil {
		log.Printf("failed to move back other tasks in db: %v", err)
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}

func GetTask(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID) (*database.Task, error) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return nil, err
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	var task database.Task
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = taskCollection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": taskID},
			{"user_id": userID},
		}}).Decode(&task)
	if err != nil {
		c.JSON(404, gin.H{"detail": "Task not found.", "taskId": taskID})
		return nil, err
	}
	return &task, nil
}

func MarkTaskComplete(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, updateParams *UpdateParams, task *database.Task, isCompleted *bool) bool {
	if !*isCompleted {
		c.JSON(400, gin.H{"detail": "Tasks can only be marked as complete."})
		return false
	}
	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(task.SourceID)
	if err != nil {
		log.Printf("failed to load external task source: %v", err)
		Handle500(c)
		return false
	}

	if !taskSourceResult.Details.IsCompletable {
		c.JSON(400, gin.H{"detail": "cannot be marked done"})
		return false
	}

	err = taskSourceResult.Source.MarkAsDone(userID, task.SourceAccountID, task.IDExternal)
	if err != nil {
		log.Printf("failed to mark task as complete: %v", err)
		c.JSON(503, gin.H{"detail": "Failed to mark task as complete"})
		return false
	}

	updateParams.IsCompleted = true
	return true
}

func UpdateTaskTitle(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, updateParams *UpdateParams, title *string) bool {
	if *title == "" {
		c.JSON(400, gin.H{"detail": "Title cannot be empty"})
		return false
	}
	updateParams.Title = *title
	return true
}

func UpdateTaskBody(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, updateParams *UpdateParams, body *string) bool {
	updateParams.Body = *body
	return true
}

func UpdateTaskDueDate(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, updateParams *UpdateParams, dueDateTime *time.Time) bool {
	dueDate := primitive.NewDateTimeFromTime(*dueDateTime)
	updateParams.DueDate = dueDate
	return true
}

func UpdateTaskTimeDuration(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, updateParams *UpdateParams, timeDuration int) bool {
	if timeDuration < 0 {
		c.JSON(400, gin.H{"detail": "Time duration cannot be negative"})
		return false
	}
	updateParams.TimeAllocation = int64(timeDuration * 1000 * 1000)
	return true
}

func UpdateTask(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, updateParams *UpdateParams, task *database.Task) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	res, err := taskCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": taskID},
			{"user_id": userID},
		}},
		bson.M{"$set": updateParams},
	)
	if err != nil {
		log.Printf("failed to update internal DB: %v", err)
		Handle500(c)
		return
	}
	if res.MatchedCount != 1 || res.ModifiedCount != 1 {
		log.Println("failed to update task", res)
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}
