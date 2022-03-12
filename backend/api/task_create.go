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
	AccountID     string     `json:"account_id"`
	Title         string     `json:"title" binding:"required"`
	Body          string     `json:"body"`
	DueDate       *time.Time `json:"due_date"`
	TimeDuration  *int       `json:"time_duration"`
	IDTaskSection *string    `json:"id_task_section"`
}

func (api *API) TaskCreate(c *gin.Context) {
	parentCtx := c.Request.Context()
	sourceID := c.Param("source_id")
	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(sourceID)
	if err != nil || !taskSourceResult.Details.IsCreatable {
		Handle404(c)
		return
	}

	var taskCreateParams TaskCreateParams
	err = c.BindJSON(&taskCreateParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter."})
		return
	}

	IDTaskSection := primitive.NilObjectID
	if taskCreateParams.IDTaskSection != nil {
		IDTaskSection, err = primitive.ObjectIDFromHex(*taskCreateParams.IDTaskSection)
		if err != nil {
			c.JSON(400, gin.H{"detail": "'id_task_section' is not a valid ID"})
			return
		}
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	if sourceID != external.TASK_SOURCE_ID_GT_TASK {
		db, dbCleanup, err := database.GetDBConnection()
		if err != nil {
			Handle500(c)
			return
		}
		defer dbCleanup()

		externalAPICollection := database.GetExternalTokenCollection(db)
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		count, err := externalAPICollection.CountDocuments(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"account_id": taskCreateParams.AccountID},
				{"source_id": sourceID},
				{"user_id": userID},
			}},
		)
		if err != nil || count <= 0 {
			c.JSON(404, gin.H{"detail": "account ID not found"})
			return
		}
	} else {
		// default is currently the only acceptable accountID for general task task source
		taskCreateParams.AccountID = external.GeneralTaskDefaultAccountID
	}

	var timeAllocation *int64
	if taskCreateParams.TimeDuration != nil {
		timeAllocationTemp := (time.Duration(*taskCreateParams.TimeDuration) * time.Second).Nanoseconds()
		timeAllocation = &timeAllocationTemp
	}
	taskCreationObject := external.TaskCreationObject{
		Title:          taskCreateParams.Title,
		Body:           taskCreateParams.Body,
		DueDate:        taskCreateParams.DueDate,
		TimeAllocation: timeAllocation,
		IDTaskSection:  IDTaskSection,
	}
	err = taskSourceResult.Source.CreateNewTask(userID, taskCreateParams.AccountID, taskCreationObject)
	if err != nil {
		c.JSON(503, gin.H{"detail": "failed to create task"})
		return
	}
	c.JSON(200, gin.H{})
}
