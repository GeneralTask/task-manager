package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/constants"
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

	dbCtx, cancel := context.WithTimeout(c.Request.Context(), constants.DatabaseTimeout)
	defer cancel()

	event, err := database.GetItem(dbCtx, eventID, userID)
	if err != nil {
		c.JSON(404, gin.H{"detail": "event not found", "eventID": eventID})
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

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	fieldsToUpdate := database.CalendarEventChangeableFields{}
	if modifyParams.Summary != nil {
		fieldsToUpdate.Title = *modifyParams.Summary
	}
	if modifyParams.Description != nil {
		fieldsToUpdate.Body = *modifyParams.Description
	}
	if modifyParams.DatetimeStart != nil {
		fieldsToUpdate.CalendarEvent.DatetimeStart = primitive.NewDateTimeFromTime(*modifyParams.DatetimeStart)
	}
	if modifyParams.DatetimeEnd != nil {
		fieldsToUpdate.CalendarEvent.DatetimeEnd = primitive.NewDateTimeFromTime(*modifyParams.DatetimeEnd)
	}

	_, err = database.UpdateOrCreateItem(db, userID, event.IDExternal, event.SourceID, nil, fieldsToUpdate, nil, false)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}
