package api

import (
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestOverview(t *testing.T) {
	authtoken := login("test_overview@generaltask.com", "")
	api := GetAPI()
	router := GetRouter(api)
	t.Run("UnauthorizedGetViews", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/overview/views/", nil)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
	t.Run("SuccessGetViews", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/overview/views/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		regex := `\[{"id":"[a-z0-9]{24}","name":"Default","type":"task_section","logo":"generaltask","is_linked":false,"sources":null,"task_section_id":"000000000000000000000001","is_reorderable":true,"ordering_id":1,"view_items":\[{"id":"[a-z0-9]{24}","id_ordering":1,"source":{"name":"General Task","logo":"\/images\/generaltask.svg","logo_v2":"generaltask","is_completable":true,"is_replyable":false},"deeplink":"","title":"🎉 Welcome! Here are some tasks to get you started.","body":"","sender":"","due_date":"","time_allocated":0,"sent_at":"1970-01\-01T00:00:00Z","is_done":false},{"id":"[a-z0-9]{24}","id_ordering":2,"source":{"name":"General Task","logo":"\/images\/generaltask.svg","logo_v2":"generaltask","is_completable":true,"is_replyable":false},"deeplink":"","title":"Try creating a task above! 👆","body":"","sender":"","due_date":"","time_allocated":0,"sent_at":"1970-01\-01T00:00:00Z","is_done":false},{"id":"[a-z0-9]{24}","id_ordering":3,"source":{"name":"General Task","logo":"\/images\/generaltask.svg","logo_v2":"generaltask","is_completable":true,"is_replyable":false},"deeplink":"","title":"👈 Link your email and task accounts in settings!","body":"","sender":"","due_date":"","time_allocated":0,"sent_at":"1970-01\-01T00:00:00Z","is_done":false}]}]`
		assert.Regexp(t, regex, string(body))
	})
	t.Run("NoViews", func(t *testing.T) {
		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		ctx := context.Background()
		viewCollection := database.GetViewCollection(db)
		viewCollection.DeleteMany(ctx, bson.M{})

		request, _ := http.NewRequest("GET", "/overview/views/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "[]", string(body))
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
		assert.NotNil(t, result)
		assert.Equal(t, 0, len(result))
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
		expectedViewResult := OverviewResult[[]*TaskResult]{
			ID:            views[0].ID,
			Name:          taskSectionName,
			Type:          ViewTaskSection,
			Logo:          "generaltask",
			IsLinked:      false,
			IsReorderable: false,
			IDOrdering:    1,
			TaskSectionID: taskSectionID,
			ViewItems: []*TaskResult{{
				ID: taskResult.InsertedID.(primitive.ObjectID),
			}},
		}
		assert.NoError(t, err)
		assert.Len(t, result, 1)
		overviewResult, ok := result[0].(*OverviewResult[[]*TaskResult])
		assert.True(t, ok)
		assertOverviewViewResultEqual(t, expectedViewResult, *overviewResult)
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
	api := GetAPI()

	expectedViewResult := OverviewResult[[]*TaskResult]{
		ID:            view.ID,
		Name:          taskSectionName,
		Type:          ViewTaskSection,
		Logo:          "generaltask",
		IsLinked:      false,
		IsReorderable: false,
		IDOrdering:    1,
		TaskSectionID: taskSectionID,
	}

	t.Run("EmptyViewItems", func(t *testing.T) {
		api := GetAPI()
		result, err := api.GetTaskSectionOverviewResult(db, parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.ViewItems = []*TaskResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
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
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
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
		result, err := api.GetTaskSectionOverviewResult(db, parentCtx, view, userID)
		assert.Error(t, err)
		assert.Equal(t, "mongo: no documents in result", err.Error())
		assert.Nil(t, result)
	})
}

func TestIsServiceLinked(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	api := GetAPI()

	userID := primitive.NewObjectID()
	testServiceID := "testID"
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	externalAPITokenCollection.InsertOne(parentCtx, database.ExternalAPIToken{
		UserID:    userID,
		ServiceID: testServiceID,
	})

	t.Run("ServiceLinked", func(t *testing.T) {
		result, err := api.IsServiceLinked(db, parentCtx, userID, testServiceID)
		assert.NoError(t, err)
		assert.True(t, result)
	})
	t.Run("InvalidUserID", func(t *testing.T) {
		result, err := api.IsServiceLinked(db, parentCtx, primitive.NewObjectID(), testServiceID)
		assert.NoError(t, err)
		assert.False(t, result)
	})
	t.Run("InvalidServiceID", func(t *testing.T) {
		result, err := api.IsServiceLinked(db, parentCtx, userID, "invalidServiceID")
		assert.NoError(t, err)
		assert.False(t, result)
	})
}

func TestOverviewViewDelete(t *testing.T) {
	api := GetAPI()
	router := GetRouter(api)
	t.Run("UnauthorizedViewDelete", func(t *testing.T) {
		request, _ := http.NewRequest("DELETE", "/overview/views/1", nil)
		response := httptest.NewRecorder()
		router.ServeHTTP(response, request)
		assert.Equal(t, http.StatusUnauthorized, response.Code)
	})

}

func assertOverviewViewResultEqual[T ViewItems](t *testing.T, expected OverviewResult[T], actual OverviewResult[T]) {
	assert.Equal(t, expected.Name, actual.Name)
	assert.Equal(t, expected.Type, actual.Type)
	assert.Equal(t, expected.Logo, actual.Logo)
	assert.Equal(t, expected.IsLinked, actual.IsLinked)
	assert.Equal(t, expected.Sources, actual.Sources)
	assert.Equal(t, expected.TaskSectionID, actual.TaskSectionID)
	assert.Equal(t, expected.IsReorderable, actual.IsReorderable)
	assert.Equal(t, expected.IDOrdering, actual.IDOrdering)
	assert.Equal(t, len(expected.ViewItems), len(actual.ViewItems))
	for i := range expected.ViewItems {
		assert.Equal(t, expected.ViewItems[i].ID, actual.ViewItems[i].ID)
	}
}
