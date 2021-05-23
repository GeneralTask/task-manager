package api

import (
	"context"
	"log"
	"net/http"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskReplyParams struct {
	Body string `json:"body" binding:"required"`
}

func (api *API) TaskReply(c *gin.Context) {
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

	taskCollection := db.Collection("tasks")
	var taskBase database.TaskBase
	err = taskCollection.FindOne(
		context.TODO(),
		bson.D{{Key: "_id", Value: taskID}, {Key: "user_id", Value: userID}}).Decode(&taskBase)

	if err != nil {
		Handle404(c)
		return
	}

	if taskBase.Source.Name == database.TaskSourceGmail.Name {
		err = ReplyToEmail(api, userID.(primitive.ObjectID), taskID, replyParams.Body)
		if err != nil {
			log.Printf("Unable to send email with error %v", err)
			c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "unable to send email"})
		} else {
			c.JSON(http.StatusCreated, gin.H{})
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "task cannot be replied to"})
	}
}
