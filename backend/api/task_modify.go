package api

import (
	"context"
	"log"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskModifyParams struct {
	IDOrdering int `json:"id_ordering" binding:"required"`
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
		c.JSON(400, gin.H{"detail": "'id_ordering' parameter missing or malformatted"})
		return
	}
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
