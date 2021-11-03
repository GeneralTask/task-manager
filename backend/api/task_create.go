package api

import (
	"context"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskCreateParams struct {
	Title     string     `json:"title" binding:"required"`
	Body      string     `json:"body" binding:"required"`
	DueDate   *time.Time `json:"due_date" binding:"required"`
	SourceID  *string    `json:"source_id" binding:"required"`
	AccountID *string    `json:"account_id" binding:"required"`
}

func (api *API) TaskCreate(c *gin.Context) {
	var taskCreateParams TaskCreateParams
	err := c.BindJSON(&taskCreateParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "Invalid or missing parameter."})
		return
	}

	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(*taskCreateParams.SourceID)
	if err != nil {
		c.JSON(400, gin.H{"detail": "Could not find task source."})
		return
	}

	userID, _ := c.Get("user")

	taskCreationObject := external.TaskCreationObject{
		Title:   taskCreateParams.Title,
		Body:    taskCreateParams.Body,
		DueDate: taskCreateParams.DueDate,
	}

	externalAPICollection := database.GetExternalTokenCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	count, err := externalAPICollection.CountDocuments(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": taskCreateParams.AccountID},
			{"user_id": userID},
		}},
	)

	if count <= 0 {
		c.JSON(404, gin.H{"detail": "Account ID not found"})
		return
	}

	err = taskSourceResult.Source.CreateNewTask(userID.(primitive.ObjectID), *taskCreateParams.AccountID, taskCreationObject)
}
