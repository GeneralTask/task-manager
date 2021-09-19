package api

import (
	"context"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"log"
	"time"
)

type TaskModifyParams struct {
	IDOrdering    *int    `json:"id_ordering"`
	IDTaskSection *string `json:"id_task_section"`
	IsCompleted   *bool   `json:"is_completed"`
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

	if err != nil || (modifyParams.IsCompleted == nil && modifyParams.IDOrdering == nil && modifyParams.IDTaskSection == nil) {
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

	if modifyParams.IsCompleted != nil && modifyParams.IDOrdering != nil {
		c.JSON(400, gin.H{"detail": "Cannot reorder and mark as complete"})
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	if modifyParams.IsCompleted != nil {
		if *modifyParams.IsCompleted {
			MarkTaskComplete(api, c, taskID, userID)
		} else {
			c.JSON(400, gin.H{"detail": "Tasks can only be marked as complete."})
		}
	} else if modifyParams.IDOrdering != nil || modifyParams.IDTaskSection != nil {
		ReOrderTask(c, taskID, userID, modifyParams.IDOrdering, modifyParams.IDTaskSection)
	} else {
		c.JSON(400, gin.H{"detail": "Parameter missing or malformatted"})
		return
	}

}

func ReOrderTask(c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, IDOrdering *int, IDTaskSectionHex *string) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	taskCollection := db.Collection("tasks")
	updateParams := bson.M{"has_been_reordered": true}
	if IDOrdering != nil {
		updateParams["id_ordering"] = *IDOrdering
	}
	var IDTaskSection primitive.ObjectID
	if IDTaskSectionHex != nil {
		IDTaskSection, _ = primitive.ObjectIDFromHex(*IDTaskSectionHex)
		updateParams["id_task_section"] = IDTaskSection
	} else {
		var task database.TaskBase
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": taskID}).Decode(&task)
		if err != nil {
			log.Printf("failed to load task in db: %v", err)
		}
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

func MarkTaskComplete(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	taskCollection := db.Collection("tasks")

	var task database.TaskBase
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	if taskCollection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": taskID},
			{"user_id": userID},
		}}).Decode(&task) != nil {
		c.JSON(404, gin.H{"detail": "Task not found.", "taskId": taskID})
		return
	}

	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(task.SourceID)
	if err != nil {
		log.Printf("failed to load external task source: %v", err)
		Handle500(c)
		return
	}

	if !taskSourceResult.Details.IsCompletable {
		c.JSON(400, gin.H{"detail": "cannot be marked done"})
		return
	}

	err = taskSourceResult.Source.MarkAsDone(userID, task.SourceAccountID, task.IDExternal)
	if err != nil {
		c.JSON(400, gin.H{"detail": "Failed to mark task as complete"})
		return
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = taskCollection.UpdateOne(dbCtx, bson.M{"_id": taskID}, bson.M{"$set": bson.M{"is_completed": true}})
	if err != nil {
		log.Printf("failed to update internal DB with completion status: %v", err)
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}

type TaskCreateParams struct {
	Title     *string    `json:"title"`
	Body      *string    `json:"body"`
	DueDate   *time.Time `json:"due_date"`
	SourceID  *string    `json:"source_id"`
	AccountID *string    `json:"account_id"`
}

func (api *API) TaskCreate(c *gin.Context) {
	var taskCreateParams TaskCreateParams
	err := c.BindJSON(&taskCreateParams)

	if err != nil {
		Handle500(c)
	}

	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	defer dbCleanup()

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	if err != nil {
		c.JSON(400, gin.H{"detail": "Invalid or missing parameter."})
		return
	}

	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(*taskCreateParams.SourceID)
	if err != nil {
		c.JSON(400, gin.H{"detail": "Could not find task source."})
		return
	}

	userID, _ := c.Get("user")

	taskCreationObject := external.TaskCreationObject{
		Title:   taskCreateParams.Title,
		Body:    taskCreateParams.Body,
		DueDate: taskCreateParams.DueDate,
	}

	externalAPICollection := database.GetExternalTokenCollection(db)

	count, err := externalAPICollection.CountDocuments(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": taskCreateParams.AccountID},
			{"user_id": userID},
		}})

	if count <= 0 {
		c.JSON(404, gin.H{"detail": "Account ID not found"})
		return
	}

	err = taskSourceResult.Source.CreateNewTask(userID.(primitive.ObjectID), *taskCreateParams.AccountID, taskCreationObject)
}
