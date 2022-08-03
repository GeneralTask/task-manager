package api

import (
	"context"
	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) EventModify(c *gin.Context) {
	eventIDHex := c.Param("event_id")
	eventID, err := primitive.ObjectIDFromHex(eventIDHex)
	if err != nil {
		// This means the event ID is improperly formatted
		c.JSON(400, gin.H{"detail": "event ID missing or malformatted"})
		return
	}
	var modifyParams external.EventModifyObject
	err = c.BindJSON(&modifyParams)
	if err != nil {
		api.Logger.Error().Err(err).Msg("invalid or missing parameter, err")
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}
	userID := getUserIDFromContext(c)

	event, err := database.GetItem(c.Request.Context(), eventID, userID)
	if err != nil {
		c.JSON(404, gin.H{"detail": "task not found.", "taskId": eventID})
		return
	}
	eventSourceResult, err := api.ExternalConfig.GetTaskSourceResult(event.SourceID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to load external task source")
		Handle500(c)
		return
	}

	err = eventSourceResult.Source.ModifyEvent(userID, modifyParams.AccountID, event.IDExternal, &modifyParams)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update external task source")
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}

func (api *API) updateEventInDB(c *gin.Context, task *database.Item, userID primitive.ObjectID, updateFields *database.CalendarEventChangeableFields) error {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	flattenedUpdateFields, err := database.FlattenStruct(updateFields)
	if err != nil {
		api.Logger.Error().Err(err).Msgf("failed to flatten struct %+v", updateFields)
		return err
	}

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	res, err := taskCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": task.ID},
			{"user_id": userID},
		}},
		bson.M{"$set": flattenedUpdateFields},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update internal DB")
		return err
	}
	if res.MatchedCount != 1 {
		log.Print("failed to update task", res)
		return nil // todo return an error here
	}
	return nil
}
