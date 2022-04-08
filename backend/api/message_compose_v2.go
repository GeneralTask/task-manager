package api

import (
	"context"
	"log"
	"net/http"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type messageComposeParamsV2 struct {
	Subject         *string              `json:"subject"`
	Body            *string              `json:"body" binding:"required"`
	Recipients      *database.Recipients `json:"recipients" binding:"required"`
	SourceID        string               `json:"source_id" binding:"required"`
	SourceAccountID string               `json:"source_account_id" binding:"required"`
}

func (api *API) MessageComposeV2(c *gin.Context) {
	var requestParams messageComposeParams
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

	if requestParams.MessageID != nil {
		handleReply(c, userID, taskSourceResult, &requestParams)
	} else {
		handleCompose(c, userID, taskSourceResult, &requestParams)
	}
}

func handleCompose(c *gin.Context, userID primitive.ObjectID, taskSourceResult *external.TaskSourceResult, requestParams *messageComposeParams) {
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

func handleReply(c *gin.Context, userID primitive.ObjectID, taskSourceResult *external.TaskSourceResult, requestParams *messageComposeParams) {
	if !taskSourceResult.Details.IsReplyable {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "task cannot be replied to"})
		return
	}
	messageID, err := primitive.ObjectIDFromHex(*requestParams.MessageID)
	if err != nil {
		log.Printf("could not parse message id with error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"detail": "could not parse message id"})
		return
	}
	err = checkMesageBelongsToUser(userID, messageID)
	if err != nil {
		Handle404(c)
		return
	}
	contents := external.EmailContents{
		Recipients: requestParams.Recipients,
		Body:       *requestParams.Body,
	}
	err = taskSourceResult.Source.Reply(userID, requestParams.SourceAccountID, messageID, contents)
	if err != nil {
		log.Printf("unable to send email with error: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "unable to send email"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{})
}

func checkMesageBelongsToUser(userID primitive.ObjectID, messageID primitive.ObjectID) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()

	taskCollection := database.GetTaskCollection(db)
	var taskBase database.TaskBase
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = taskCollection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{{"_id": messageID}, {"user_id": userID}}}).Decode(&taskBase)
	return err
}
