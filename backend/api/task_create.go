package api

import (
	"context"
	"errors"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type TaskCreateParams struct {
	AccountID     string     `json:"account_id"`
	Title         string     `json:"title" binding:"required"`
	Body          string     `json:"body"`
	DueDate       *time.Time `json:"due_date"`
	TimeDuration  *int       `json:"time_duration"`
	IDTaskSection *string    `json:"id_task_section"`
	ParentTaskID  *string    `json:"parent_task_id"`
}

func (api *API) TaskCreate(c *gin.Context) {
	parentCtx := c.Request.Context()
	sourceID := c.Param("source_id")
	taskSourceResult, err := api.ExternalConfig.GetSourceResult(sourceID)
	if err != nil || !taskSourceResult.Details.CanCreateTask {
		Handle404(c)
		return
	}

	var taskCreateParams TaskCreateParams
	err = c.BindJSON(&taskCreateParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	IDTaskSection := primitive.NilObjectID
	if taskCreateParams.IDTaskSection != nil {
		IDTaskSection, err = getValidTaskSection(*taskCreateParams.IDTaskSection, userID, api.DB)
		if err != nil {
			c.JSON(400, gin.H{"detail": "'id_task_section' is not a valid ID"})
			return
		}
	}

	if sourceID != external.TASK_SOURCE_ID_GT_TASK {
		externalAPICollection := database.GetExternalTokenCollection(api.DB)
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
		var assignedUser *database.User
		var tempTitle string
		assignedUser, tempTitle, err = getValidExternalOwnerAssignedTask(api.DB, userID, taskCreateParams.Title)
		if err == nil {
			userID = assignedUser.ID
			IDTaskSection = constants.IDTaskSectionDefault
			taskCreateParams.Title = tempTitle
		}
	}

	var timeAllocation *int64
	if taskCreateParams.TimeDuration != nil {
		timeAllocationTemp := (time.Duration(*taskCreateParams.TimeDuration) * time.Second).Nanoseconds()
		timeAllocation = &timeAllocationTemp
	}

	var parentID primitive.ObjectID
	if taskCreateParams.ParentTaskID != nil {
		parentID, err = primitive.ObjectIDFromHex(*taskCreateParams.ParentTaskID)
		if err != nil {
			c.JSON(400, gin.H{"detail": "'parent_task_id' is not a valid ID"})
			return
		}
	}

	taskCreationObject := external.TaskCreationObject{
		Title:          taskCreateParams.Title,
		Body:           taskCreateParams.Body,
		DueDate:        taskCreateParams.DueDate,
		TimeAllocation: timeAllocation,
		IDTaskSection:  IDTaskSection,
		ParentTaskID:   parentID,
	}
	taskID, err := taskSourceResult.Source.CreateNewTask(api.DB, userID, taskCreateParams.AccountID, taskCreationObject)
	if err != nil {
		c.JSON(503, gin.H{"detail": "failed to create task"})
		return
	}
	if parentID != primitive.NilObjectID {
		err = database.AddSubTask(api.DB, userID, parentID, taskID)
		// if error, log and return
		// if this proves to be common, should explore deletion of newly created task
		if err != nil {
			c.JSON(503, gin.H{"detail": "failed to add as subtask"})
			return
		}
	}
	c.JSON(200, gin.H{"task_id": taskID})
}

func getValidTaskSection(taskSectionIDHex string, userID primitive.ObjectID, db *mongo.Database) (primitive.ObjectID, error) {
	IDTaskSection, err := primitive.ObjectIDFromHex(taskSectionIDHex)
	if err != nil {
		return primitive.NilObjectID, errors.New("malformatted task section")
	}
	taskSectionCollection := database.GetTaskSectionCollection(db)
	dbCtx, cancel := context.WithTimeout(context.Background(), constants.DatabaseTimeout)
	defer cancel()
	count, err := taskSectionCollection.CountDocuments(dbCtx, bson.M{"$and": []bson.M{{"user_id": userID}, {"_id": IDTaskSection}}})
	if (err != nil || count == int64(0)) &&
		IDTaskSection != constants.IDTaskSectionDefault {
		return primitive.NilObjectID, errors.New("task section ID not found")
	}
	return IDTaskSection, nil
}
