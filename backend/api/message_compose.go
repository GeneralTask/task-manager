package api

import (
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
	SourceID        string               `json:"source_id" binding:"required"`
	SourceAccountID string               `json:"source_account_id" binding:"required"`
}

func (api *API) MessageCompose(c *gin.Context) {
	var requestParams messageComposeParams
	err := c.BindJSON(&requestParams)
	if err != nil {
		api.Logger.Error().Err(err).Msg("parameter missing or malformatted, error")
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(requestParams.SourceID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to load external task source")
		c.JSON(400, gin.H{"detail": "invalid source id"})
		return
	}

	if requestParams.MessageID != nil {
		api.handleReply(c, userID, taskSourceResult, &requestParams)
	} else {
		api.handleCompose(c, userID, taskSourceResult, &requestParams)
	}
}

func (api *API) handleCompose(c *gin.Context, userID primitive.ObjectID, taskSourceResult *external.TaskSourceResult, requestParams *messageComposeParams) {
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
		api.Logger.Error().Err(err).Msg("failed to send email")
		c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "failed to send email"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{})
}

func (api *API) handleReply(c *gin.Context, userID primitive.ObjectID, taskSourceResult *external.TaskSourceResult, requestParams *messageComposeParams) {
	if !taskSourceResult.Details.IsReplyable {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "task cannot be replied to"})
		return
	}

	messageID, err := primitive.ObjectIDFromHex(*requestParams.MessageID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("could not parse message id with error")
		c.JSON(http.StatusBadRequest, gin.H{"detail": "could not parse message id"})
		return
	}

	contents := external.EmailContents{
		Recipients: requestParams.Recipients,
		Body:       *requestParams.Body,
	}
	err = taskSourceResult.Source.Reply(userID, requestParams.SourceAccountID, messageID, contents)
	if err != nil {
		api.Logger.Error().Err(err).Msg("unable to send email with error")
		c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "unable to send email"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{})
}
