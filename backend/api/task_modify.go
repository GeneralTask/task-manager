package api

import (
	"context"
	"errors"
	"log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskModifyParams struct {
	IDOrdering    *int    `json:"id_ordering"`
	IDTaskSection *string `json:"id_task_section"`
	database.TaskChangeableFields
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
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	if modifyParams.IDTaskSection != nil {
		_, err := primitive.ObjectIDFromHex(*modifyParams.IDTaskSection)
		if err != nil {
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

	// check if all fields are empty
	if modifyParams == (TaskModifyParams{}) {
		c.JSON(400, gin.H{"detail": "parameter missing"})
		return
	}

	updateTaskInDB := false

	// handle edit fields
	// check if all edit fields are empty
	if modifyParams.TaskChangeableFields != (database.TaskChangeableFields{IsCompleted: modifyParams.IsCompleted}) {
		if !ValidateFields(c, &modifyParams.TaskChangeableFields) {
			return
		}

		taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(task.SourceID)
		if err != nil {
			log.Printf("failed to load external task source: %v", err)
			Handle500(c)
			return
		}

		// update external task
		err = taskSourceResult.Source.ModifyTask(userID, task.SourceAccountID, task.ID, &modifyParams.TaskChangeableFields)
		if err != nil {
			log.Printf("failed to update external task source: %v", err)
			Handle500(c)
			return
		}

		updateTaskInDB = true
	}

	// handle reorder task
	if modifyParams.IDOrdering != nil || modifyParams.IDTaskSection != nil {
		err = ReOrderTask(c, taskID, userID, modifyParams.IDOrdering, modifyParams.IDTaskSection, task)
		if err != nil {
			return
		}
	}
	// handle mark complete
	if modifyParams.IsCompleted != nil && *modifyParams.IsCompleted {
		err = MarkTaskComplete(api, c, taskID, userID, task, *modifyParams.IsCompleted)
		if err != nil {
			return
		}
	}
	if modifyParams.IsCompleted != nil && !*modifyParams.IsCompleted {
		updateTaskInDB = true
	}

	if updateTaskInDB {
		UpdateTask(api, c, taskID, userID, &modifyParams.TaskChangeableFields, task)
	}

	c.JSON(200, gin.H{})
}

func ValidateFields(c *gin.Context, updateFields *database.TaskChangeableFields) bool {
	if updateFields.Title != nil && *updateFields.Title == "" {
		c.JSON(400, gin.H{"detail": "title cannot be empty"})
		return false
	}
	if updateFields.TimeAllocation != nil {
		if *updateFields.TimeAllocation < 0 {
			c.JSON(400, gin.H{"detail": "time duration cannot be negative"})
			return false
		} else {
			*updateFields.TimeAllocation *= constants.NANOSECONDS_IN_SECOND
		}
	}
	return true
}

func ReOrderTask(c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, IDOrdering *int, IDTaskSectionHex *string, task *database.Item) error {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return err
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)
	updateFields := bson.M{"has_been_reordered": true}
	if IDOrdering != nil {
		updateFields["id_ordering"] = *IDOrdering
	}
	var IDTaskSection primitive.ObjectID
	if IDTaskSectionHex != nil {
		IDTaskSection, _ = primitive.ObjectIDFromHex(*IDTaskSectionHex)
		updateFields["id_task_section"] = IDTaskSection
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
		bson.M{"$set": updateFields},
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

func GetTask(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID) (*database.Item, error) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return nil, err
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	var task database.Item
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = taskCollection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": taskID},
			{"user_id": userID},
		}}).Decode(&task)
	if err != nil {
		c.JSON(404, gin.H{"detail": "task not found.", "taskId": taskID})
		return nil, err
	}
	return &task, nil
}

func MarkTaskComplete(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, task *database.Item, isCompleted bool) error {
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
		c.JSON(503, gin.H{"detail": "failed to mark task as complete"})
		return err
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return err
	}
	defer dbCleanup()

	return database.MarkItemComplete(db, taskID)
}

func UpdateTask(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, updateFields *database.TaskChangeableFields, task *database.Item) {
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
		bson.M{"$set": updateFields},
	)
	if err != nil {
		log.Printf("failed to update internal DB: %v", err)
		Handle500(c)
		return
	}
	if res.MatchedCount != 1 {
		log.Println("failed to update task", res)
		Handle500(c)
		return
	}
}
