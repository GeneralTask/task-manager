package api

import (
	"context"
	"fmt"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func (api *API) EventCreate(c *gin.Context) {
	sourceID := c.Param("source_id")
	taskSourceResult, err := api.ExternalConfig.GetSourceResult(sourceID)
	if err != nil || !taskSourceResult.Details.CanCreateCalendarEvent {
		Handle404(c)
		return
	}

	var eventCreateObject external.EventCreateObject
	err = c.Bind(&eventCreateObject)
	if err != nil {
		api.Logger.Error().Err(err).Msg("invalid or missing parameter, err")
		c.JSON(400, gin.H{"detail": "invalid or missing parameter."})
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	_ = database.GetTaskCollection(db)

	dbCtx, cancel := context.WithTimeout(c.Request.Context(), constants.DatabaseTimeout)
	defer cancel()

	userID := getUserIDFromContext(c)

	var taskObjectID primitive.ObjectID
	if eventCreateObject.TaskID != "" {
		taskObjectID, err = primitive.ObjectIDFromHex(eventCreateObject.TaskID)
		if err != nil {
			c.JSON(400, gin.H{"detail": fmt.Sprintf("invalid linked task ID: %s", eventCreateObject.TaskID)})
			return
		}
		// check that the task exists
		_, err := database.GetItem(dbCtx, taskObjectID, userID)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(400, gin.H{"detail": fmt.Sprintf("linked task not found: %s", eventCreateObject.TaskID)})
			} else {
				api.Logger.Error().Err(err).Msgf("linked task not found: %s, err", eventCreateObject.TaskID)
				Handle500(c)
				return
			}
		}
	}

	// generate ID for event so we can use this when inserting into database
	eventID := primitive.NewObjectID()
	eventCreateObject.ID = eventID

	err = taskSourceResult.Source.CreateNewEvent(userID, eventCreateObject.AccountID, eventCreateObject)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update external task source")
		Handle500(c)
		return
	}

	event := database.CalendarEvent{
		ID:              eventID,
		UserID:          userID,
		IDExternal:      eventID.Hex(),
		SourceID:        sourceID,
		SourceAccountID: eventCreateObject.AccountID,
		Title:           eventCreateObject.Summary,
		Body:            eventCreateObject.Description,
		DatetimeEnd:     primitive.NewDateTimeFromTime(*eventCreateObject.DatetimeEnd),
		DatetimeStart:   primitive.NewDateTimeFromTime(*eventCreateObject.DatetimeStart),
		LinkedTaskID:    taskObjectID,
	}

	_, err = database.UpdateOrCreateCalendarEvent(
		db,
		userID,
		eventID.Hex(),
		sourceID,
		event,
		nil,
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to create calendar event in database")
		Handle500(c)
		return
	}
	c.JSON(201, gin.H{"event_id": eventID.Hex()})
}
