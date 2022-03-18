package api

import (
	"log"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type messageComposeParams struct {
	MessageID       *string              `json:"message_id"`
	Subject         *string              `json:"subject" binding:"required"`
	Body            *string              `json:"body" binding:"required"`
	Recipients      *database.Recipients `json:"recipients" binding:"required"`
	SourceID        *string              `json:"source_id" binding:"required"`
	SourceAccountID *string              `json:"source_account_id" binding:"required"`
}

func (api *API) MessageCompose(c *gin.Context) {
	var requestParams messageComposeParams
	err := c.BindJSON(&requestParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		log.Println(err)
		return
	}

	if requestParams.MessageID == nil {
		// todo - route specifically to reply
		// api.MessageReply(c)
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	// TODO - validate sourceid
	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(*requestParams.SourceID)
	if err != nil {
		log.Printf("failed to load external task source: %v", err)
		Handle500(c)
		return
	}

	// update external message
	contents := external.EmailContents{
		To:         requestParams.Recipients.To[0].Email,
		Recipients: requestParams.Recipients,
		Subject:    *requestParams.Subject,
		Body:       *requestParams.Body,
	}
	err = taskSourceResult.Source.SendEmail(userID, *requestParams.SourceAccountID, contents)
	if err != nil {
		log.Printf("failed to update external task source: %v", err)
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{})
}
