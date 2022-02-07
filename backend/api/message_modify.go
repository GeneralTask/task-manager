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

type messageModifyParams struct {
	IsUnread *bool `json:"is_unread"`
	IsTask   *bool `json:"is_task"`
}

type MessageModifyParams struct {
	IsUnread *bool `json:"is_unread"`
	IsTask   *bool `json:"is_task"`
}

func (api *API) MessageModify(c *gin.Context) {
	taskIDHex := c.Param("message_id")
	taskID, err := primitive.ObjectIDFromHex(taskIDHex)
	if err != nil {
		// This means the message ID is improperly formatted
		Handle404(c)
		return
	}
	var modifyParams MessageModifyParams
	err = c.BindJSON(&modifyParams)

	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	task, err := getMessage(api, c, taskID, userID)
	if err != nil {
		// status is handled in getMessage
		return
	}

	// check if all fields are empty
	if modifyParams == (MessageModifyParams{}) {
		c.JSON(400, gin.H{"detail": "parameter missing"})
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

	updateMessage(api, c, taskID, userID, &modifyParams.TaskChangeableFields, task)

	c.JSON(200, gin.H{})
}

func getMessage(api *API, c *gin.Context, messageID primitive.ObjectID, userID primitive.ObjectID) (*database.Item, error) {
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
			{"_id": messageID},
			{"user_id": userID},
		}}).Decode(&task)
	if err != nil {
		c.JSON(404, gin.H{"detail": "message not found.", "taskId": messageID})
		return nil, err
	}
	return &task, nil
}

func updateMessage(api *API, c *gin.Context, messageID primitive.ObjectID, userID primitive.ObjectID, updateFields *database.TaskChangeableFields, task *database.Item) {
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
			{"_id": messageID},
			{"user_id": userID},
		}},
		bson.M{"$set": updateFields},
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
}
