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
	sourceID := c.Param("source_id")
	taskSourceResult, err := api.ExternalConfig.GetSourceResult(sourceID)
	if err != nil || !taskSourceResult.Details.CanCreateTask {
		Handle404(c)
		return
	}

	if 2 != 3 {
		c.Status(400)
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

	IDTaskSection := constants.IDTaskSectionDefault
	if taskCreateParams.IDTaskSection != nil {
		IDTaskSection, err = getValidTaskSection(*taskCreateParams.IDTaskSection, userID, api.DB)
		if err != nil {
			c.JSON(400, gin.H{"detail": "'id_task_section' is not a valid ID"})
			return
		}
	}

	if sourceID != external.TASK_SOURCE_ID_GT_TASK {
		externalAPICollection := database.GetExternalTokenCollection(api.DB)
		count, err := externalAPICollection.CountDocuments(
			context.Background(),
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
		parentID, err = getValidTask(*taskCreateParams.ParentTaskID, userID, api.DB)
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
	// this database.Task is only used for IDTaskSection and ParentTaskID fields
	IDOrdering := constants.DefaultTaskIDOrdering
	err = api.ReOrderTask(c, taskID, userID, &IDOrdering, nil, &database.Task{
		IDTaskSection: IDTaskSection,
		ParentTaskID:  parentID,
	})
	if err != nil {
		c.JSON(500, gin.H{"detail": "failed to move task to front of folder"})
		return
	}
	c.JSON(200, gin.H{"task_id": taskID})
}

func getValidTaskSection(taskSectionIDHex string, userID primitive.ObjectID, db *mongo.Database) (primitive.ObjectID, error) {
	IDTaskSection, err := primitive.ObjectIDFromHex(taskSectionIDHex)
	if err != nil {
		return primitive.NilObjectID, errors.New("malformatted task section")
	}
	taskSectionCollection := database.GetTaskSectionCollection(db)
	count, err := taskSectionCollection.CountDocuments(context.Background(), bson.M{"$and": []bson.M{{"user_id": userID}, {"_id": IDTaskSection}}})
	if (err != nil || count == int64(0)) &&
		IDTaskSection != constants.IDTaskSectionDefault {
		return primitive.NilObjectID, errors.New("task section ID not found")
	}
	return IDTaskSection, nil
}

func getValidTask(taskIDHex string, userID primitive.ObjectID, db *mongo.Database) (primitive.ObjectID, error) {
	parentID, err := primitive.ObjectIDFromHex(taskIDHex)
	if err != nil {
		return primitive.NilObjectID, errors.New("malformatted parent id")
	}
	taskCollection := database.GetTaskCollection(db)
	count, err := taskCollection.CountDocuments(context.Background(), bson.M{"$and": []bson.M{{"user_id": userID}, {"_id": parentID}}})
	if err != nil || count == int64(0) {
		return primitive.NilObjectID, errors.New("task not found")
	}
	return parentID, nil
}
