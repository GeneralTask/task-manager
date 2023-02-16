package api

import (
	"fmt"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) EventCreate(c *gin.Context) {
	sourceID := c.Param("source_id")
	taskSourceResult, err := api.ExternalConfig.GetSourceResult(sourceID)
	if err != nil || !taskSourceResult.Details.CanCreateCalendarEvent {
		Handle404(c)
		return
	}

	var eventCreateObject external.EventCreateObject
	err = c.BindJSON(&eventCreateObject)
	if err != nil {
		api.Logger.Error().Err(err).Msg("invalid or missing parameter, err")
		c.JSON(400, gin.H{"detail": "invalid or missing parameter."})
		return
	}

	userID := getUserIDFromContext(c)

	linkedSourceID := ""
	if eventCreateObject.LinkedTaskID != primitive.NilObjectID {
		// check that the task exists
		linkedTask, err := database.GetTask(api.DB, eventCreateObject.LinkedTaskID, userID)
		if err != nil {
			api.Logger.Error().Err(err).Msgf("linked task not found: %s, err", eventCreateObject.LinkedTaskID.Hex())
			c.JSON(400, gin.H{"detail": fmt.Sprintf("linked task not found: %s", eventCreateObject.LinkedTaskID.Hex())})
			return
		}
		linkedSourceID = linkedTask.SourceID
	}

	if eventCreateObject.LinkedViewID != primitive.NilObjectID {
		// check that the view exists
		_, err := database.GetView(api.DB, userID, eventCreateObject.LinkedViewID)
		if err != nil {
			api.Logger.Error().Err(err).Msgf("linked view not found: %s, err", eventCreateObject.LinkedViewID.Hex())
			c.JSON(400, gin.H{"detail": fmt.Sprintf("linked view not found: %s", eventCreateObject.LinkedViewID.Hex())})
			return
		}
	}

	if eventCreateObject.LinkedPullRequestID != primitive.NilObjectID {
		// check that the task exists
		linkedPR, err := database.GetPullRequest(api.DB, eventCreateObject.LinkedPullRequestID, userID)
		if err != nil {
			api.Logger.Error().Err(err).Msgf("linked PR not found: %s, err", eventCreateObject.LinkedPullRequestID.Hex())
			c.JSON(400, gin.H{"detail": fmt.Sprintf("linked PR not found: %s", eventCreateObject.LinkedPullRequestID.Hex())})
			return
		}
		linkedSourceID = linkedPR.SourceID
	}

	// generate ID for event so we can use this when inserting into database
	externalEventID := primitive.NewObjectID()
	eventCreateObject.ID = externalEventID

	err = taskSourceResult.Source.CreateNewEvent(api.DB, userID, eventCreateObject.AccountID, eventCreateObject)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update external task source")
		Handle500(c)
		return
	}

	event := database.CalendarEvent{
		UserID:              userID,
		IDExternal:          externalEventID.Hex(),
		SourceID:            sourceID,
		SourceAccountID:     eventCreateObject.AccountID,
		Title:               eventCreateObject.Summary,
		Body:                eventCreateObject.Description,
		DatetimeEnd:         primitive.NewDateTimeFromTime(*eventCreateObject.DatetimeEnd),
		DatetimeStart:       primitive.NewDateTimeFromTime(*eventCreateObject.DatetimeStart),
		LinkedTaskID:        eventCreateObject.LinkedTaskID,
		LinkedViewID:        eventCreateObject.LinkedViewID,
		LinkedPullRequestID: eventCreateObject.LinkedPullRequestID,
		LinkedSourceID:      linkedSourceID,
	}

	insertedEvent, err := database.UpdateOrCreateCalendarEvent(
		api.DB,
		userID,
		externalEventID.Hex(),
		sourceID,
		event,
		nil,
	)

	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to create calendar event in database")
		Handle500(c)
		return
	}
	c.JSON(201, gin.H{"id": insertedEvent.ID.Hex()})
}
