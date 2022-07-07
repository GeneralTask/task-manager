package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestOverview(t *testing.T) {
	api := GetAPI()
	router := GetRouter(api)
	t.Run("Unauthorized", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/overview/views/", nil)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
}

func TestGetOverviewResults(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	parentCtx := context.Background()
	api := GetAPI()

	t.Run("NoViews", func(t *testing.T) {
		result, err := api.GetOverviewResults(db, parentCtx, []database.View{}, primitive.NewObjectID())
		assert.NoError(t, err)
		assert.Nil(t, result)
	})
	t.Run("InvalidViewType", func(t *testing.T) {
		result, err := api.GetOverviewResults(db, parentCtx, []database.View{{
			Type: "invalid",
		}}, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid view type", err.Error())
		assert.Nil(t, result)
	})
	t.Run("SingleTaskSection", func(t *testing.T) {
		userID := primitive.NewObjectID()
		taskSectionName := "Test Task Section"

		taskSectionCollection := database.GetTaskSectionCollection(db)
		taskSectionResult, err := taskSectionCollection.InsertOne(parentCtx, database.TaskSection{
			Name:   taskSectionName,
			UserID: userID,
		})
		assert.NoError(t, err)
		taskSectionID := taskSectionResult.InsertedID.(primitive.ObjectID)
		views := []database.View{
			{
				ID:            primitive.NewObjectID(),
				Type:          "task_section",
				UserID:        userID,
				TaskSectionID: taskSectionID,
				IDOrdering:    1,
			},
		}

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

		result, err := api.GetOverviewResults(db, parentCtx, views, userID)
		expectedViewResult := OverviewResult{
			ID:            views[0].ID,
			Name:          taskSectionName,
			Type:          ViewTaskSection,
			Logo:          "generaltask",
			IsLinked:      false,
			IsReorderable: false,
			IDOrdering:    1,
			TaskSectionID: &taskSectionID,
			ViewItems: []*TaskResult{{
				ID: taskResult.InsertedID.(primitive.ObjectID),
			}},
		}
		assert.NoError(t, err)
		assert.Len(t, result, 1)
		assertOverviewViewResultEqual(t, expectedViewResult, result[0])
	})
}

func TestGetTaskSectionOverviewResult(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	taskSectionName := "Test Task Section"
	userID := primitive.NewObjectID()
	taskSectionCollection := database.GetTaskSectionCollection(db)
	taskSectionResult, err := taskSectionCollection.InsertOne(parentCtx, database.TaskSection{
		Name:   taskSectionName,
		UserID: userID,
	})
	assert.NoError(t, err)
	taskSectionID := taskSectionResult.InsertedID.(primitive.ObjectID)

	view := database.View{
		UserID:        userID,
		IDOrdering:    1,
		Type:          "generaltask",
		IsLinked:      false,
		TaskSectionID: taskSectionResult.InsertedID.(primitive.ObjectID),
	}
	viewCollection := database.GetViewCollection(db)
	_, err = viewCollection.InsertOne(parentCtx, view)
	assert.NoError(t, err)

	expectedViewResult := OverviewResult{
		ID:            view.ID,
		Name:          taskSectionName,
		Type:          ViewTaskSection,
		Logo:          "generaltask",
		IsLinked:      false,
		IsReorderable: false,
		IDOrdering:    1,
		TaskSectionID: &taskSectionID,
	}

	t.Run("EmptyViewItems", func(t *testing.T) {
		api := GetAPI()
		result, err := api.GetTaskSectionOverviewResult(db, parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.ViewItems = []*TaskResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, result)
	})
	t.Run("SingleTaskViewItem", func(t *testing.T) {
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
		result, err := api.GetTaskSectionOverviewResult(db, parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.ViewItems = []*TaskResult{
			{
				ID: taskID,
			},
		}
		assertOverviewViewResultEqual(t, expectedViewResult, result)
	})
	t.Run("InvalidUser", func(t *testing.T) {
		api := GetAPI()
		result, err := api.GetTaskSectionOverviewResult(db, parentCtx, view, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
		assert.Nil(t, result)
	})
	t.Run("InvalidSectionID", func(t *testing.T) {
		view.TaskSectionID = primitive.NewObjectID()
		api := GetAPI()
		result, err := api.GetTaskSectionOverviewResult(db, parentCtx, view, userID)
		assert.Error(t, err)
		assert.Equal(t, "mongo: no documents in result", err.Error())
		assert.Nil(t, result)
	})
}

func assertOverviewViewResultEqual(t *testing.T, expected OverviewResult, actual *OverviewResult) {
	assert.Equal(t, expected.Name, actual.Name)
	assert.Equal(t, expected.Type, actual.Type)
	assert.Equal(t, expected.Logo, actual.Logo)
	assert.Equal(t, expected.IsLinked, actual.IsLinked)
	assert.Equal(t, expected.Sources, actual.Sources)
	assert.Equal(t, *expected.TaskSectionID, *actual.TaskSectionID)
	assert.Equal(t, expected.IsReorderable, actual.IsReorderable)
	assert.Equal(t, expected.IDOrdering, actual.IDOrdering)
	actualItems, ok := actual.ViewItems.([]*TaskResult)
	assert.True(t, ok)
	expectedItems, ok := expected.ViewItems.([]*TaskResult)
	assert.True(t, ok)
	assert.Equal(t, len(expectedItems), len(actualItems))
	for i := range expectedItems {
		assert.Equal(t, expectedItems[i].ID, actualItems[i].ID)
	}
}
