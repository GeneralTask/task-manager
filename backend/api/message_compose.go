package api

import (
	"log"
	"net/http"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type messageComposeParams struct {
	MessageID       *string              `json:"message_id"`
	Subject         *string              `json:"subject"`
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

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	// TODO - validate sourceid
	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(*requestParams.SourceID)
	if err != nil {
		log.Printf("failed to load external task source: %v", err)
		Handle500(c)
		return
	}

	if requestParams.MessageID != nil {
		handleReply(c, userID, taskSourceResult, &requestParams)
	} else {
		handleCompose(c, userID, taskSourceResult, &requestParams)
	}
}

func handleCompose(c *gin.Context, userID primitive.ObjectID,taskSourceResult *external.TaskSourceResult, requestParams *messageComposeParams) {
	if requestParams.Subject == nil {
		log.Println("subject must be set for composed message")
		Handle500(c)
	}
	contents := external.EmailContents{
		Recipients: requestParams.Recipients,
		Subject:    *requestParams.Subject,
		Body:       *requestParams.Body,
	}
	err := taskSourceResult.Source.SendEmail(userID, *requestParams.SourceAccountID, contents)
	if err != nil {
		log.Printf("failed to update external task source: %v", err)
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{})
}

func handleReply(c *gin.Context, userID primitive.ObjectID,taskSourceResult *external.TaskSourceResult, requestParams *messageComposeParams) {
	if !taskSourceResult.Details.IsReplyable {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "task cannot be replied to"})
		return
	}
	messageID, err := primitive.ObjectIDFromHex(*requestParams.MessageID)
	if err != nil {
		log.Printf("could not parse message id with error: %v", err)
		Handle404(c)
		return
	}
	contents := external.EmailContents{
		Recipients: requestParams.Recipients,
		Body:       *requestParams.Body,
	}
	err = taskSourceResult.Source.Reply(userID, *requestParams.SourceAccountID, messageID, contents)
	if err != nil {
		log.Printf("unable to send email with error: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "unable to send email"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{})
}
