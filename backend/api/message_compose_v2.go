package api

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"log"
	"net/http"
)

type messageComposeParamsV2 struct {
	SMTPID          *string              `json:"smtp_id"`
	Subject         *string              `json:"subject"`
	Body            *string              `json:"body" binding:"required"`
	Recipients      *database.Recipients `json:"recipients" binding:"required"`
	SourceID        string               `json:"source_id" binding:"required"`
	SourceAccountID string               `json:"source_account_id" binding:"required"`
}

func (api *API) MessageComposeV2(c *gin.Context) {
	var requestParams messageComposeParamsV2
	err := c.BindJSON(&requestParams)
	if err != nil {
		log.Printf("parameter missing or malformatted, error: %v", err)
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(requestParams.SourceID)
	if err != nil {
		log.Printf("failed to load external task source: %v", err)
		c.JSON(400, gin.H{"detail": "invalid source id"})
		return
	}

	if requestParams.SMTPID != nil {
		handleReplyV2(c, userID, taskSourceResult, &requestParams)
	} else {
		handleComposeV2(c, userID, taskSourceResult, &requestParams)
	}
}

func handleComposeV2(c *gin.Context, userID primitive.ObjectID, taskSourceResult *external.TaskSourceResult, requestParams *messageComposeParamsV2) {
	if requestParams.Subject == nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "subject must be set for composed message"})
		return
	}
	contents := external.EmailContents{
		Recipients: requestParams.Recipients,
		Subject:    *requestParams.Subject,
		Body:       *requestParams.Body,
	}
	err := taskSourceResult.Source.SendEmail(userID, requestParams.SourceAccountID, contents)
	if err != nil {
		log.Printf("failed to send email: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "failed to send email"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{})
}

func handleReplyV2(c *gin.Context, userID primitive.ObjectID, taskSourceResult *external.TaskSourceResult, requestParams *messageComposeParamsV2) {
	if !taskSourceResult.Details.IsReplyable {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "task cannot be replied to"})
		return
	}

	email, err := database.GetEmailFromSMTPID(c.Request.Context(), *requestParams.SMTPID, userID)
	if err != nil {
		Handle404(c)
		return
	}

	contents := external.EmailContents{
		Recipients: requestParams.Recipients,
		Body:       *requestParams.Body,
	}
	err = taskSourceResult.Source.Reply(userID, requestParams.SourceAccountID, email.ThreadID, email.ThreadID, contents)
	if err != nil {
		log.Printf("unable to send email with error: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "unable to send email"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{})
}
