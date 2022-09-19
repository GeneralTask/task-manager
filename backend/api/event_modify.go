package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) EventModify(c *gin.Context) {
	eventIDHex := c.Param("event_id")
	eventID, err := primitive.ObjectIDFromHex(eventIDHex)
	if err != nil {
		// This means the event ID is improperly formatted
		c.JSON(400, gin.H{"detail": "event ID missing or malformed"})
		return
	}
	var modifyParams external.EventModifyObject
	err = c.BindJSON(&modifyParams)
	if err != nil {
		api.Logger.Error().Err(err).Msg("invalid or missing parameter")
		c.JSON(400, gin.H{"detail": "parameter missing or malformed"})
		return
	}

	// check that modifyParams isn't empty
	emptyObj := external.EventModifyObject{AccountID: modifyParams.AccountID}
	if modifyParams == emptyObj {
		c.JSON(400, gin.H{"detail": "parameter missing"})
		return
	}

	userID := getUserIDFromContext(c)

	event, err := database.GetCalendarEvent(api.DB, context.Background(), eventID, userID)
	if err != nil {
		c.JSON(404, gin.H{"detail": "event not found", "eventID": eventID})
		return
	}

	eventSourceResult, err := api.ExternalConfig.GetSourceResult(event.SourceID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to load external task source")
		Handle500(c)
		return
	}

	err = eventSourceResult.Source.ModifyEvent(api.DB, userID, modifyParams.AccountID, event.IDExternal, &modifyParams)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update external task source")
		Handle500(c)
		return
	}

	err = api.updateEventInDB(modifyParams, event, userID)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}

func (api *API) updateEventInDB(modifyParams external.EventModifyObject, event *database.CalendarEvent, userID primitive.ObjectID) error {
	if modifyParams.Summary != nil {
		event.Title = *modifyParams.Summary
	}
	if modifyParams.Description != nil {
		event.Body = *modifyParams.Description
	}
	if modifyParams.DatetimeStart != nil {
		event.DatetimeStart = primitive.NewDateTimeFromTime(*modifyParams.DatetimeStart)
	}
	if modifyParams.DatetimeEnd != nil {
		event.DatetimeEnd = primitive.NewDateTimeFromTime(*modifyParams.DatetimeEnd)
	}

	_, err := database.UpdateOrCreateCalendarEvent(api.DB, userID, event.IDExternal, event.SourceID, event, nil)
	if err != nil {
		return err
	}
	return nil
}
