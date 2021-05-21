package api

import (
	"context"
	"log"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"log"
)

type TaskModifyParams struct {
	IDOrdering *int `json:"id_ordering"`
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

	if modifyParams.IsCompleted != nil {
		if *modifyParams.IsCompleted {
			MarkTaskComplete(c, taskID)
		} else {
			c.JSON(400, gin.H{"detail": "Tasks can only be mark as complete."})
		}
	} else if modifyParams.IDOrdering != nil {
		ReOrderTask(c, taskID, *modifyParams.IDOrdering)
	} else {
		c.JSON(400, gin.H{"detail": "Parameter missing or malformatted"})
		return
	}

}

//todo: john.
func ReOrderTask(c *gin.Context, taskID primitive.ObjectID, reorder int) {
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	taskCollection := db.Collection("tasks")
	result, err := taskCollection.UpdateOne(
		context.TODO(),
		bson.D{{Key: "_id", Value: taskID}},
		bson.D{{Key: "$set", Value: bson.D{
			{Key: "id_ordering", Value: modifyParams.IDOrdering},
			{Key: "has_been_reordered", Value: true},
		}}},
	)
	if err != nil {
		log.Fatalf("Failed to update task in db: %v", err)
	}
	if result.MatchedCount != 1 {
		Handle404(c)
		return
	}
	c.JSON(200, gin.H{})
}

func MarkTaskComplete(c *gin.Context, taskID primitive.ObjectID) {
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	taskCollection := db.Collection("tasks")

	userID, _ := c.Get("user")

	var task database.TaskBase
	if taskCollection.FindOne(nil, bson.D{{Key: "_id", Value: taskID}}).Decode(&task) != nil {
		c.JSON(404, gin.H{"detail": "Task not found.", "taskId": taskID})
		return
	}

	if task.UserID != userID {
		c.JSON(401, gin.H{})
		return
	}

	if task.Source == database.TaskSourceGoogleCalendar.Name {

	} else if task.Source == database.TaskSourceGmail.Name {
		success := MarkEmailAsRead(userID.(primitive.ObjectID).String(), task.IDExternal)
		c.JSON(200, gin.H{"success": success})
	} else if task.Source == database.TaskSourceJIRA.Name {
		return
	}
}