package api

import (
	"context"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"net/http"
)

type TaskReplyParams struct {
	Body string `json:"body"`
}

func (api *API) TaskReply(c *gin.Context) {
	taskIDHex := c.Param("task_id")
	taskID, err := primitive.ObjectIDFromHex(taskIDHex)
	if err != nil {
		// This means the task ID is improperly formatted
		Handle404(c)
		return
	}

	db, dbCleanup := database.GetDBConnection()
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
		c.JSON(http.StatusNotFound, gin.H{})
		return
	}

	if taskBase.Source == database.TaskSourceGmail.Name {
		err = ReplyToEmail(api, userID.(primitive.ObjectID), taskID, replyParams.Body)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail" : "unable to send email"})
		} else {
			c.JSON(http.StatusCreated, gin.H{})
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"detail" : "Task cannot be replied to."})
	}
}