package api

import (
	"context"
	"fmt"

	"github.com/rs/zerolog/log"

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

	message, err := database.GetItem(c.Request.Context(), messageID, userID)
	if err != nil {
		c.JSON(404, gin.H{"detail": "message not found.", "messageID": messageID})
		return
	}

	// check if all fields are empty
	if modifyParams == (messageModifyParams{}) {
		c.JSON(400, gin.H{"detail": "parameter missing"})
		return
	}
	messageChangeableFields := messageModifyParamsToChangeable(&modifyParams)

	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(message.SourceID)
	if err != nil {
		log.Error().Err(err).Msg("failed to load external task source")
		Handle500(c)
		return
	}

	// update external message
	err = taskSourceResult.Source.ModifyMessage(userID, message.SourceAccountID, message.IDExternal, messageChangeableFields)
	if err != nil {
		log.Error().Err(err).Msg("failed to update external task source")
		Handle500(c)
		return
	}

	err = updateMessageInDB(api, c.Request.Context(), messageID, userID, messageChangeableFields)
	if err != nil {
		log.Error().Err(err).Msgf("could not update message %v in DB with fields %+v", messageID, messageChangeableFields)
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{})
}

func updateMessageInDB(api *API, ctx context.Context, messageID primitive.ObjectID, userID primitive.ObjectID, updateFields *database.MessageChangeable) error {
	parentCtx := ctx
	if parentCtx == nil {
		parentCtx = context.Background()
	}
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	// We flatten in order to do partial updates of nested documents correctly in mongodb
	flattenedUpdateFields, err := flatbson.Flatten(updateFields)
	if err != nil {
		log.Error().Err(err).Msgf("Could not flatten %+v", updateFields)
		return err
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
		log.Error().Err(err).Msg("failed to update internal DB")
		return err
	}
	if res.MatchedCount != 1 {
		// Note, we don't consider res.ModifiedCount because no-op updates don't count as modified
		log.Error().Msgf("failed to find message %+v", res)
		return fmt.Errorf("failed to find message %+v", res)
	}

	return nil
}

func messageModifyParamsToChangeable(modifyParams *messageModifyParams) *database.MessageChangeable {
	return &database.MessageChangeable{
		TaskType:        &database.TaskTypeChangeable{IsTask: modifyParams.IsTask},
		EmailChangeable: database.EmailChangeable{IsUnread: modifyParams.IsUnread},
	}
}
