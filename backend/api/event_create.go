package api

import (
	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
)

func (api *API) EventCreate(c *gin.Context) {
	sourceID := c.Param("source_id")
	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(sourceID)
	if err != nil || !taskSourceResult.Details.CanCreateCalendarEvent {
		Handle404(c)
		return
	}

	var eventCreateObject external.EventCreateObject
	err = c.Bind(&eventCreateObject)
	if err != nil {
		log.Error().Err(err).Msg("invalid or missing parameter, err")
		c.JSON(400, gin.H{"detail": "invalid or missing parameter."})
		return
	}

	userID := getUserIDFromContext(c)
	err = taskSourceResult.Source.CreateNewEvent(userID, eventCreateObject.AccountID, eventCreateObject)
	if err != nil {
		log.Error().Err(err).Msg("failed to update external task source")
		Handle500(c)
		return
	}
	c.JSON(201, gin.H{})
}
