package api

import (
	"context"
	"errors"
	"log"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskModifyParams struct {
	IDOrdering  *int  `json:"id_ordering"`
	IsCompleted *bool `json:"is_completed"`
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

	if err != nil || (modifyParams.IsCompleted == nil && modifyParams.IDOrdering == nil) {
		c.JSON(400, gin.H{"detail": "Parameter missing or malformatted"})
		return
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
	} else if modifyParams.IDOrdering != nil {
		ReOrderTask(c, taskID, userID, *modifyParams.IDOrdering)
	} else {
		c.JSON(400, gin.H{"detail": "Parameter missing or malformatted"})
		return
	}

}

func ReOrderTask(c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, reorder int) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	taskCollection := db.Collection("tasks")
	result, err := taskCollection.UpdateOne(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"_id": taskID},
			{"user_id": userID},
		}},
		bson.D{{Key: "$set", Value: bson.D{
			{Key: "id_ordering", Value: reorder},
			{Key: "has_been_reordered", Value: true},
		}}},
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
	_, err = taskCollection.UpdateMany(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"_id": bson.M{"$ne": taskID}},
			{"id_ordering": bson.M{"$gte": reorder}},
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
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	taskCollection := db.Collection("tasks")

	var task database.TaskBase
	if taskCollection.FindOne(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"_id": taskID},
			{"user_id": userID},
		}}).Decode(&task) != nil {
		c.JSON(404, gin.H{"detail": "Task not found.", "taskId": taskID})
		return
	}

	if task.Source.Name == database.TaskSourceGoogleCalendar.Name {
		err = errors.New("invalid task type")
	} else if task.Source.Name == database.TaskSourceGmail.Name {
		err = MarkEmailAsDone(api, userID, task.SourceAccountID, task.IDExternal)
	} else if task.Source.Name == database.TaskSourceJIRA.Name {
		err = MarkJIRATaskDone(api, userID, task.SourceAccountID, task.IDExternal)
	}

	if err == nil {
		_, err := taskCollection.UpdateOne(nil, bson.D{{"_id", taskID}}, bson.D{{"$set", bson.D{{"is_completed", true}}}})
		if err != nil {
			log.Printf("failed to update internal DB with completion status: %v", err)
			Handle500(c)
			return
		}
		c.JSON(200, gin.H{})
	} else {
		c.JSON(400, gin.H{"detail": "Failed to mark task as complete"})
	}
}
