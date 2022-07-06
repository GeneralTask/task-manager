package api

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestGetTaskSectionOverviewResult(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	taskSectionName := "Test Task Section"
	taskSectionCollection := database.GetTaskSectionCollection(db)
	taskSectionResult, err := taskSectionCollection.InsertOne(parentCtx, database.TaskSection{
		Name: taskSectionName,
	})
	assert.NoError(t, err)
	taskSectionID := taskSectionResult.InsertedID.(primitive.ObjectID)

	userID := primitive.NewObjectID()
	view := database.View{
		UserID:        userID,
		IDOrdering:    1,
		Type:          "generaltask",
		IsPaginated:   false,
		IsLinked:      false,
		TaskSectionID: taskSectionResult.InsertedID.(primitive.ObjectID),
	}
	viewCollection := database.GetViewCollection(db)
	_, err = viewCollection.InsertOne(parentCtx, view)
	assert.NoError(t, err)

	t.Run("NoTaskView", func(t *testing.T) {
		api := GetAPI()
		result, err := api.GetTaskSectionOverviewResult(parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, taskSectionName, result.Name)
		assert.Equal(t, ViewTaskSection, result.Type)
		assert.Equal(t, "generaltask", result.Logo)
		assert.Equal(t, false, result.IsLinked)
		assert.Equal(t, []SourcesResult(nil), result.Sources)
		assert.Equal(t, taskSectionID, *result.TaskSectionID)
		assert.Equal(t, false, result.IsPaginated)
		assert.Equal(t, false, result.IsReorderable)
		assert.Equal(t, 1, result.IDOrdering)
		items, ok := result.ViewItems.([]*TaskResult)
		assert.True(t, ok)
		assert.Equal(t, 0, len(items))
	})
	t.Run("SingleTaskView", func(t *testing.T) {
		taskCollection := database.GetTaskCollection(db)
		taskResult, err := taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        userID,
				IsCompleted:   false,
				IDTaskSection: taskSectionID,
				SourceID:      external.TASK_SOURCE_ID_GT_TASK,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		})
		assert.NoError(t, err)
		taskID := taskResult.InsertedID.(primitive.ObjectID)

		api := GetAPI()
		result, err := api.GetTaskSectionOverviewResult(parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, taskSectionName, result.Name)
		assert.Equal(t, ViewTaskSection, result.Type)
		assert.Equal(t, "generaltask", result.Logo)
		assert.Equal(t, false, result.IsLinked)
		assert.Equal(t, []SourcesResult(nil), result.Sources)
		assert.Equal(t, taskSectionID, *result.TaskSectionID)
		assert.Equal(t, false, result.IsPaginated)
		assert.Equal(t, false, result.IsReorderable)
		assert.Equal(t, 1, result.IDOrdering)
		items, ok := result.ViewItems.([]*TaskResult)
		assert.True(t, ok)
		assert.Equal(t, 1, len(items))
		assert.Equal(t, taskID, items[0].ID)
	})
}
