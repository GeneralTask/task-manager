package api

import (
	"context"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) EventDelete(c *gin.Context) {
	eventIDHex := c.Param("event_id")
	eventID, err := primitive.ObjectIDFromHex(eventIDHex)
	if err != nil {
		// This means the task ID is improperly formatted
		Handle404(c)
		return
	}
	parentCtx := c.Request.Context()

	userID := getUserIDFromContext(c)
	event, err := database.GetItem(c.Request.Context(), eventID, userID)
	if err != nil {
		c.JSON(404, gin.H{"detail": "event not found.", "eventID": eventID})
		return
	}

	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(event.SourceID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to load external event source")
		Handle500(c)
		return
	}

	err = taskSourceResult.Source.DeleteEvent(userID, event.SourceAccountID, event.IDExternal)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update external task source")
		Handle500(c)
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	res, err := taskCollection.DeleteOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": eventID},
			{"user_id": userID},
		}},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update internal DB")
		Handle500(c)
		return
	}
	if res.DeletedCount != 1 {
		api.Logger.Error().Msgf("failed to delete event in DB %+v", res)
		Handle404(c)
		return
	}
	c.JSON(200, gin.H{})
}
