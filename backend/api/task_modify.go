package api

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskModifyParams struct {
	IDOrdering    *int    `json:"id_ordering"`
	IDTaskSection *string `json:"id_task_section"`
}

// using a separate struct with omitempty so that other task fields are not overwritten
type UpdateParams struct {
	Title          string             `json:"title" bson:"title,omitempty"`
	Body           string             `json:"body" bson:"body,omitempty"`
	DueDate        primitive.DateTime `json:"due_date" bson:"due_date,omitempty"`
	TimeAllocation int64              `json:"time_duration" bson:"time_allocated,omitempty"`
	IsCompleted    *bool              `json:"is_completed" bson:"is_completed,omitempty"`
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

	var updateParams UpdateParams
	err = c.BindJSON(&updateParams)

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

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	task, err := GetTask(api, c, taskID, userID)
	if err != nil {
		// status is handled in GetTask
		return
	}

	isValid := true
	// reorder task
	if modifyParams.IDOrdering != nil || modifyParams.IDTaskSection != nil {
		err = ReOrderTask(c, taskID, userID, modifyParams.IDOrdering, modifyParams.IDTaskSection, task)
		if err != nil {
			return
		}
	}
	if modifyParams.IsCompleted != nil {
		isValid = MarkTaskComplete(api, c, taskID, userID, &updateParams, task, modifyParams.IsCompleted)
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

func ReOrderTask(c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, IDOrdering *int, IDTaskSectionHex *string, task *database.Task) error {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return err
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
		return err
	}
	if result.MatchedCount != 1 {
		Handle404(c)
		return errors.New("task not found")
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
		return err
	}
	return nil
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

func MarkTaskComplete(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, updateParams *UpdateParams, task *database.Task, isCompleted *bool) error {
	if !*isCompleted {
		c.JSON(400, gin.H{"detail": "Tasks can only be marked as complete."})
		return errors.New("Tasks can only be marked as complete.")
	}
	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(task.SourceID)
	if err != nil {
		log.Printf("failed to load external task source: %v", err)
		Handle500(c)
		return err
	}

	if !taskSourceResult.Details.IsCompletable {
		c.JSON(400, gin.H{"detail": "cannot be marked done"})
		return errors.New("cannot be marked done")
	}

	err = taskSourceResult.Source.MarkAsDone(userID, task.SourceAccountID, task.IDExternal)
	if err != nil {
		log.Printf("failed to mark task as complete: %v", err)
		c.JSON(503, gin.H{"detail": "Failed to mark task as complete"})
		return err
	}

	updateParams.IsCompleted = true
	return nil
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
