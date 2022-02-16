package api

import (
	"context"
	"log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/chidiwilliams/flatbson"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type messageModifyParams struct {
	IsUnread *bool `json:"is_unread"`
	IsTask   *bool `json:"is_task"`
}

func (api *API) MessageModify(c *gin.Context) {
	messageIDHex := c.Param("message_id")
	messageID, err := primitive.ObjectIDFromHex(messageIDHex)
	if err != nil {
		// This means the message ID is improperly formatted
		Handle404(c)
		return
	}
	var modifyParams messageModifyParams
	err = c.BindJSON(&modifyParams)

	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	task, err := getMessage(api, c, messageID, userID)
	if err != nil {
		// status is handled in getMessage
		return
	}

	// check if all fields are empty
	if modifyParams == (messageModifyParams{}) {
		c.JSON(400, gin.H{"detail": "parameter missing"})
		return
	}
	messageChangeableFields := messageModifyParamsToChangeableFields(&modifyParams)

	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(task.SourceID)
	if err != nil {
		log.Printf("failed to load external task source: %v", err)
		Handle500(c)
		return
	}

	// update external task
	err = taskSourceResult.Source.ModifyMessage(userID, task.SourceAccountID, task.IDExternal, messageChangeableFields)
	if err != nil {
		log.Printf("failed to update external task source: %v", err)
		Handle500(c)
		return
	}

	updateMessageInDB(api, c, messageID, userID, messageChangeableFields)

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

	var message database.Item
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = taskCollection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": messageID},
			{"user_id": userID},
		}}).Decode(&message)
	if err != nil {
		c.JSON(404, gin.H{"detail": "message not found.", "messageID": messageID})
		return nil, err
	}
	return &message, nil
}

func updateMessageInDB(api *API, c *gin.Context, messageID primitive.ObjectID, userID primitive.ObjectID, updateFields *database.MessageChangeable) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	// We flatten in order to do partial updates of nested documents correctly in mongodb
	flattenedUpdateFields, err := flatbson.Flatten(updateFields)
	if err != nil {
		log.Printf("Could not flatten %+v, error: %+v", updateFields, err)
		Handle500(c)
		return
	}
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	res, err := taskCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": messageID},
			{"user_id": userID},
		}},
		bson.M{"$set": flattenedUpdateFields},
	)

	if err != nil {
		log.Printf("failed to update internal DB: %v", err)
		Handle500(c)
		return
	}
	if res.MatchedCount != 1 {
		// Note, we don't consider res.ModifiedCount because no-op updates don't count as modified
		log.Printf("failed to find task %+v", res)
		Handle500(c)
		return
	}
}

func messageModifyParamsToChangeableFields(modifyParams *messageModifyParams) *database.MessageChangeable {
	var changeableFields database.MessageChangeable
	if modifyParams.IsTask != nil {
		changeableFields.TaskType = &database.TaskTypeChangeable{
			IsTask: modifyParams.IsTask,
		}
	}
	if modifyParams.IsUnread != nil {
		changeableFields.EmailChangeable.IsUnread = modifyParams.IsUnread
	}
	return &changeableFields
}
