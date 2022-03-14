package api

import (
	"log"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type messageReplyParams struct {
	Body *string `json:"body"`
}

func (api *API) MessageReply(c *gin.Context) {
	messageIDHex := c.Param("message_id")
	messageID, err := primitive.ObjectIDFromHex(messageIDHex)
	if err != nil {
		// This means the message ID is improperly formatted
		Handle404(c)
		return
	}
	var requestParams messageReplyParams
	err = c.BindJSON(&requestParams)

	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	message, err := database.GetItem(c.Request.Context(), messageID, userID)
	if err != nil {
		c.JSON(404, gin.H{"detail": "message not found.", "messageID": messageID})
		return
	}

	// check if all fields are empty
	if requestParams == (messageReplyParams{}) {
		c.JSON(400, gin.H{"detail": "parameter missing"})
		return
	}

	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(message.SourceID)
	if err != nil {
		log.Printf("failed to load external task source: %v", err)
		Handle500(c)
		return
	}

	// update external message
	err = taskSourceResult.Source.Reply(userID, message.SourceAccountID, message.ID, *requestParams.Body)
	if err != nil {
		log.Printf("failed to update external task source: %v", err)
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{})
}
