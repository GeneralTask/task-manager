package api

import (
	"log"

	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type messageComposeParams struct {
	Subject         *string     `json:"subject"`
	Body            *string     `json:"body"`
	Recipients      *Recipients `json:"recipients"`
	SourceID        *string     `json:"source_id"`
	SourceAccountID *string     `json:"source_account_id"`
}

func (api *API) MessageCompose(c *gin.Context) {
	var requestParams messageComposeParams
	err := c.BindJSON(&requestParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}
	// check if all fields are empty
	// TODO - add proper params validation
	if requestParams == (messageComposeParams{}) {
		c.JSON(400, gin.H{"detail": "parameter missing"})
		return
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
		To:      requestParams.Recipients.To[0].Email,
		Subject: *requestParams.Subject,
		Body: 	 *requestParams.Body,
	}
	err = taskSourceResult.Source.SendEmail(userID, *requestParams.SourceAccountID, contents)
	if err != nil {
		log.Printf("failed to update external task source: %v", err)
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{})
}
