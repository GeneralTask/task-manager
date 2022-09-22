package api

import (
	"context"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) EventDelete(c *gin.Context) {
	startTime := time.Now()
	eventIDHex := c.Param("event_id")
	eventID, err := primitive.ObjectIDFromHex(eventIDHex)
	if err != nil {
		// This means the task ID is improperly formatted
		log.Debug().Err(err).Msgf("could not parse event_id=%s", eventIDHex)
		Handle404(c)
		return
	}
	userID := getUserIDFromContext(c)

	event, err := database.GetCalendarEvent(api.DB, eventID, userID)
	if err != nil {
		c.JSON(404, gin.H{"detail": "event not found", "eventID": eventID})
		return
	}

	taskSourceResult, err := api.ExternalConfig.GetSourceResult(event.SourceID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to load external event source")
		Handle500(c)
		return
	}

	err = taskSourceResult.Source.DeleteEvent(api.DB, userID, event.SourceAccountID, event.IDExternal)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update external task source")
		Handle500(c)
		return
	}

	eventCollection := database.GetCalendarEventCollection(api.DB)
	res, err := eventCollection.DeleteOne(
		context.Background(),
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
	go database.LogRequestInfo(api.DB, startTime, userID, "/events/delete/", time.Now().UnixMilli()-startTime.UnixMilli(), &event.ID, event.SourceID, 0)
	c.JSON(200, gin.H{})
}
