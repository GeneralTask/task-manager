package api

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
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
	var modifyParams database.CalendarEventChangeableFields
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

	err = eventSourceResult.Source.ModifyEvent(userID, event.SourceAccountID, eventID, &modifyParams)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update external task source")
		Handle500(c)
		return
	}
	c.JSON(201, gin.H{})
}
