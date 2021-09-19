package api

import (
	"context"
	"log"
	"net/http"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskReplyParams struct {
	Body string `json:"body" binding:"required"`
}

func (api *API) TaskReply(c *gin.Context) {
	parentCtx := c.Request.Context()
	taskIDHex := c.Param("task_id")
	taskID, err := primitive.ObjectIDFromHex(taskIDHex)
	if err != nil {
		// This means the task ID is improperly formatted
		Handle404(c)
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	userID, _ := c.Get("user")

	var replyParams TaskReplyParams
	err = c.BindJSON(&replyParams)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "missing `body` param"})
		return
	}

	taskCollection := database.GetTaskCollection(db)
	var taskBase database.TaskBase
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = taskCollection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{{"_id": taskID}, {"user_id": userID}}}).Decode(&taskBase)

	if err != nil {
		Handle404(c)
		return
	}

	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(taskBase.SourceID)
	if err != nil {
		log.Printf("error loading external task source: %v", err)
		Handle500(c)
		return
	}
	if !taskSourceResult.Details.IsReplyable {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "task cannot be replied to"})
		return
	}
	err = taskSourceResult.Source.Reply(userID.(primitive.ObjectID), taskBase.SourceAccountID, taskID, replyParams.Body)
	if err != nil {
		log.Printf("unable to send email with error: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "unable to send email"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{})
}
