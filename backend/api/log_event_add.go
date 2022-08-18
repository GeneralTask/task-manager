package api

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LogEventParams struct {
	EventType string `json:"event_type" binding:"required"`
}

func (api *API) LogEventAdd(c *gin.Context) {
	var params LogEventParams
	err := c.BindJSON(&params)
	if err != nil {
		api.Logger.Error().Err(err).Msg("error")
		c.JSON(400, gin.H{"detail": "invalid or missing 'event_type' parameter."})
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	userID, _ := c.Get("user")
	err = database.InsertLogEvent(db, userID.(primitive.ObjectID), params.EventType)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to insert waitlist entry")
		Handle500(c)
		return
	}
	c.JSON(201, gin.H{})
}
