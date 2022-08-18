package api

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestOverview(t *testing.T) {
	authtoken := login("test_overview@generaltask.com", "")
	api, _ := GetAPI()
	router := GetRouter(api)
	UnauthorizedTest(t, "GET", "/overview/views/", nil)
	t.Run("SuccessGetViews", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/overview/views/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		regex := `\[{"id":"[a-z0-9]{24}","name":"Default","type":"task_section","logo":"generaltask","is_linked":true,"sources":\[\],"task_section_id":"000000000000000000000001","is_reorderable":true,"ordering_id":1,"view_items":\[{"id":"[a-z0-9]{24}","id_ordering":1,"source":{"name":"General Task","logo":"\/images\/generaltask.svg","logo_v2":"generaltask","is_completable":true,"is_replyable":false},"deeplink":"","title":"🎉 Welcome! Here are some tasks to get you started.","body":"","sender":"","due_date":"","time_allocated":0,"sent_at":"1970-01\-01T00:00:00Z","is_done":false},{"id":"[a-z0-9]{24}","id_ordering":2,"source":{"name":"General Task","logo":"\/images\/generaltask.svg","logo_v2":"generaltask","is_completable":true,"is_replyable":false},"deeplink":"","title":"Try creating a task above! 👆","body":"","sender":"","due_date":"","time_allocated":0,"sent_at":"1970-01\-01T00:00:00Z","is_done":false},{"id":"[a-z0-9]{24}","id_ordering":3,"source":{"name":"General Task","logo":"\/images\/generaltask.svg","logo_v2":"generaltask","is_completable":true,"is_replyable":false},"deeplink":"","title":"👈 Link your email and task accounts in settings!","body":"","sender":"","due_date":"","time_allocated":0,"sent_at":"1970-01\-01T00:00:00Z","is_done":false}]},{"id":"[a-z0-9]{24}","name":"Slack","type":"slack","logo":"slack","is_linked":false,"sources":\[{"name":"Slack","authorization_url":"http://localhost:8080/link/slack/"}\],"task_section_id":"000000000000000000000000","is_reorderable":false,"ordering_id":2,"view_items":\[\]}]`
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
	api, _ := GetAPI()

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
		expectedViewResult := OverviewResult[TaskResult]{
			ID:            views[0].ID,
			Name:          taskSectionName,
			Type:          ViewTaskSection,
			Logo:          "generaltask",
			IsLinked:      false,
			Sources:       []SourcesResult{},
			IsReorderable: false,
			IDOrdering:    1,
			TaskSectionID: taskSectionID,
			ViewItems: []*TaskResult{{
				ID: taskResult.InsertedID.(primitive.ObjectID),
			}},
		}
		assert.NoError(t, err)
		assert.Len(t, result, 1)
		overviewResult, ok := result[0].(*OverviewResult[TaskResult])
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
	api, _ := GetAPI()

	expectedViewResult := OverviewResult[TaskResult]{
		ID:            view.ID,
		Name:          taskSectionName,
		Type:          ViewTaskSection,
		Logo:          "generaltask",
		IsLinked:      false,
		Sources:       []SourcesResult{},
		IsReorderable: false,
		IDOrdering:    1,
		TaskSectionID: taskSectionID,
	}

	t.Run("EmptyViewItems", func(t *testing.T) {
		api, _ := GetAPI()
		result, err := api.GetTaskSectionOverviewResult(db, parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.ViewItems = []*TaskResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
	t.Run("SuccessTaskViewItems", func(t *testing.T) {
		taskCollection := database.GetTaskCollection(db)
		items := []interface{}{
			database.Item{
				TaskBase: database.TaskBase{
					UserID:        userID,
					IsCompleted:   false,
					IDTaskSection: taskSectionID,
					SourceID:      external.TASK_SOURCE_ID_GT_TASK,
					IDOrdering:    4,
				},
				TaskType: database.TaskType{
					IsTask: true,
				}},
			database.Item{
				TaskBase: database.TaskBase{
					UserID:        userID,
					IsCompleted:   false,
					IDTaskSection: taskSectionID,
					SourceID:      external.TASK_SOURCE_ID_GT_TASK,
					IDOrdering:    2,
				},
				TaskType: database.TaskType{
					IsTask: true,
				}},
			database.Item{
				TaskBase: database.TaskBase{
					UserID:        userID,
					IsCompleted:   false,
					IDTaskSection: taskSectionID,
					SourceID:      external.TASK_SOURCE_ID_GT_TASK,
					IDOrdering:    3,
				},
				TaskType: database.TaskType{
					IsTask: true,
				}},
		}
		taskResult, err := taskCollection.InsertMany(parentCtx, items)
		assert.NoError(t, err)
		assert.Equal(t, 3, len(taskResult.InsertedIDs))
		firstTaskID := taskResult.InsertedIDs[0].(primitive.ObjectID)
		secondTaskID := taskResult.InsertedIDs[1].(primitive.ObjectID)
		thirdTaskID := taskResult.InsertedIDs[2].(primitive.ObjectID)

		api, _ := GetAPI()
		result, err := api.GetTaskSectionOverviewResult(db, parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		// Check results are in the correct order, and the IDOrderings begin at 1
		expectedViewResult.ViewItems = []*TaskResult{
			{
				ID:         secondTaskID,
				IDOrdering: 1,
			},
			{
				ID:         thirdTaskID,
				IDOrdering: 2,
			},
			{
				ID:         firstTaskID,
				IDOrdering: 3,
			},
		}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
	t.Run("InvalidUser", func(t *testing.T) {
		api, _ := GetAPI()
		result, err := api.GetTaskSectionOverviewResult(db, parentCtx, view, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
		assert.Nil(t, result)
	})
	t.Run("InvalidSectionIDGracefullyHandled", func(t *testing.T) {
		view.TaskSectionID = primitive.NewObjectID()
		result, err := api.GetTaskSectionOverviewResult(db, parentCtx, view, userID)
		assert.NoError(t, err)
		assert.Nil(t, result)
	})
}

func TestGetLinearOverviewResult(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	_, err = externalAPITokenCollection.InsertOne(parentCtx, database.ExternalAPIToken{
		UserID:    userID,
		Token:     "testtoken",
		ServiceID: external.TaskServiceLinear.ID,
	})
	assert.NoError(t, err)
	view := database.View{
		UserID:     userID,
		IDOrdering: 1,
		Type:       "linear",
		IsLinked:   true,
	}
	viewCollection := database.GetViewCollection(db)
	_, err = viewCollection.InsertOne(parentCtx, view)
	assert.NoError(t, err)
	api, _ := GetAPI()
	authURL := "http://localhost:8080/link/linear/"
	expectedViewResult := OverviewResult[TaskResult]{
		ID:            view.ID,
		Name:          "Linear",
		Type:          ViewLinear,
		Logo:          "linear",
		IsLinked:      true,
		IsReorderable: false,
		Sources: []SourcesResult{
			{
				Name:             "Linear",
				AuthorizationURL: &authURL,
			},
		},
		IDOrdering:    1,
		TaskSectionID: primitive.NilObjectID,
	}
	t.Run("EmptyViewItems", func(t *testing.T) {
		result, err := api.GetLinearOverviewResult(db, parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.ViewItems = []*TaskResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
	t.Run("SingleLinearViewItem", func(t *testing.T) {
		taskCollection := database.GetTaskCollection(db)
		taskResult, err := taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        userID,
				IsCompleted:   false,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_LINEAR,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		})
		assert.NoError(t, err)

		// Insert completed Linear task. This task should not be in the view result.
		_, err = taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        userID,
				IsCompleted:   true,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_LINEAR,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		})
		assert.NoError(t, err)

		// Insert task with different source. This task should not be in the view result.
		_, err = taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        userID,
				IsCompleted:   false,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      "randomSource",
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		})
		assert.NoError(t, err)

		// Insert item that is not a task. This item should not be in the view result.
		_, err = taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        userID,
				IsCompleted:   false,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_LINEAR,
			},
			TaskType: database.TaskType{
				IsTask: false,
			},
		})
		assert.NoError(t, err)

		// Insert Linear task with different UserID. This task should not be in the view result.
		_, err = taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        primitive.NewObjectID(),
				IsCompleted:   false,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_LINEAR,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		})
		assert.NoError(t, err)

		taskID := taskResult.InsertedID.(primitive.ObjectID)
		result, err := api.GetLinearOverviewResult(db, parentCtx, view, userID)
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
		result, err := api.GetLinearOverviewResult(db, parentCtx, view, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
		assert.Nil(t, result)
	})
	t.Run("ViewNotLinked", func(t *testing.T) {
		view.IsLinked = false
		result, err := api.GetLinearOverviewResult(db, parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.IsLinked = false
		expectedViewResult.ViewItems = []*TaskResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
}

func TestGetSlackOverviewResult(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	_, err = externalAPITokenCollection.InsertOne(parentCtx, database.ExternalAPIToken{
		UserID:    userID,
		Token:     "testtoken",
		ServiceID: external.TaskServiceSlack.ID,
	})
	assert.NoError(t, err)
	view := database.View{
		UserID:     userID,
		IDOrdering: 1,
		Type:       "slack",
		IsLinked:   true,
	}
	viewCollection := database.GetViewCollection(db)
	_, err = viewCollection.InsertOne(parentCtx, view)
	assert.NoError(t, err)
	api, _ := GetAPI()
	authURL := "http://localhost:8080/link/slack/"
	expectedViewResult := OverviewResult[TaskResult]{
		ID:       view.ID,
		Name:     "Slack",
		Type:     ViewSlack,
		Logo:     "slack",
		IsLinked: true,
		Sources: []SourcesResult{
			{
				Name:             "Slack",
				AuthorizationURL: &authURL,
			},
		},
		IsReorderable: false,
		IDOrdering:    1,
		TaskSectionID: primitive.NilObjectID,
	}
	t.Run("EmptyViewItems", func(t *testing.T) {
		result, err := api.GetSlackOverviewResult(db, parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.ViewItems = []*TaskResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
	t.Run("SingleSlackViewItem", func(t *testing.T) {
		taskCollection := database.GetTaskCollection(db)
		taskResult, err := taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        userID,
				IsCompleted:   false,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_SLACK_SAVED,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		})
		assert.NoError(t, err)
		_, err = taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        userID,
				IsCompleted:   true,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_SLACK_SAVED,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		})
		assert.NoError(t, err)
		_, err = taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        userID,
				IsCompleted:   false,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      "randomSource",
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		})
		assert.NoError(t, err)
		_, err = taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        userID,
				IsCompleted:   false,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_SLACK_SAVED,
			},
			TaskType: database.TaskType{
				IsTask: false,
			},
		})
		assert.NoError(t, err)
		_, err = taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        primitive.NewObjectID(),
				IsCompleted:   false,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_SLACK_SAVED,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		})
		assert.NoError(t, err)

		taskID := taskResult.InsertedID.(primitive.ObjectID)
		result, err := api.GetSlackOverviewResult(db, parentCtx, view, userID)
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
		result, err := api.GetSlackOverviewResult(db, parentCtx, view, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
		assert.Nil(t, result)
	})
	t.Run("ViewNotLinked", func(t *testing.T) {
		view.IsLinked = false
		result, err := api.GetSlackOverviewResult(db, parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.IsLinked = false
		expectedViewResult.ViewItems = []*TaskResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
}

func TestGetGithubOverviewResult(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	_, err = externalAPITokenCollection.InsertOne(parentCtx, database.ExternalAPIToken{
		UserID:    userID,
		Token:     "testtoken",
		ServiceID: external.TaskServiceGithub.ID,
	})
	assert.NoError(t, err)
	githubID := primitive.NewObjectID()
	view := database.View{
		UserID:     userID,
		IDOrdering: 1,
		Type:       "github",
		IsLinked:   true,
		GithubID:   githubID.Hex(),
	}
	viewCollection := database.GetViewCollection(db)
	_, err = viewCollection.InsertOne(parentCtx, view)
	assert.NoError(t, err)
	api, _ := GetAPI()
	authURL := "http://localhost:8080/link/github/"
	expectedViewResult := OverviewResult[PullRequestResult]{
		ID:       view.ID,
		Name:     "Github",
		Type:     ViewGithub,
		Logo:     "github",
		IsLinked: true,
		Sources: []SourcesResult{
			{
				Name:             "Github",
				AuthorizationURL: &authURL,
			},
		},
		IsReorderable: false,
		IDOrdering:    1,
		TaskSectionID: primitive.NilObjectID,
	}
	t.Run("EmptyViewItems", func(t *testing.T) {
		result, err := api.GetGithubOverviewResult(db, parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.ViewItems = []*PullRequestResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
	t.Run("SingleGithubViewItem", func(t *testing.T) {
		taskCollection := database.GetTaskCollection(db)
		pullResult, err := taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        userID,
				IsCompleted:   false,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_GITHUB_PR,
			},
			PullRequest: database.PullRequest{
				RepositoryID: githubID.Hex(),
			},
			TaskType: database.TaskType{
				IsPullRequest: true,
			},
		})
		assert.NoError(t, err)
		// Insert completed Github PR. This PR should not be in the view result.
		_, err = taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        userID,
				IsCompleted:   true,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_GITHUB_PR,
			},
			TaskType: database.TaskType{
				IsPullRequest: true,
			},
		})
		assert.NoError(t, err)
		// Insert Item that is not type PullRequest. This should not be in the view result.
		_, err = taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        userID,
				IsCompleted:   false,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_GITHUB_PR,
			},
			TaskType: database.TaskType{
				IsPullRequest: false,
			},
		})
		assert.NoError(t, err)
		// Insert Github PR with different UserID. This PR should not be in the view result.
		_, err = taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        primitive.NewObjectID(),
				IsCompleted:   false,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_GITHUB_PR,
			},
			TaskType: database.TaskType{
				IsPullRequest: true,
			},
		})
		assert.NoError(t, err)
		// Insert Github PR with different RepositoryID. This PR should not be in the view result.
		_, err = taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:        userID,
				IsCompleted:   false,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_GITHUB_PR,
			},
			PullRequest: database.PullRequest{
				RepositoryID: primitive.NewObjectID().Hex(),
			},
			TaskType: database.TaskType{
				IsPullRequest: true,
			},
		})
		assert.NoError(t, err)

		pullRequestID := pullResult.InsertedID.(primitive.ObjectID)
		result, err := api.GetGithubOverviewResult(db, parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.ViewItems = []*PullRequestResult{
			{
				ID: pullRequestID.Hex(),
			},
		}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
	t.Run("InvalidUser", func(t *testing.T) {
		result, err := api.GetGithubOverviewResult(db, parentCtx, view, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
		assert.Nil(t, result)
	})
	t.Run("ViewNotLinked", func(t *testing.T) {
		view.IsLinked = false
		result, err := api.GetGithubOverviewResult(db, parentCtx, view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.IsLinked = false
		expectedViewResult.ViewItems = []*PullRequestResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
}

func TestUpdateViewsLinkedStatus(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	api, _ := GetAPI()
	userID := primitive.NewObjectID()
	externalAPITokenCollection := database.GetExternalTokenCollection(db)

	t.Run("InvalidUserID", func(t *testing.T) {
		views := []database.View{
			{
				UserID: userID,
			},
		}
		err := api.UpdateViewsLinkedStatus(db, parentCtx, &views, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
	})
	t.Run("NoViews", func(t *testing.T) {
		views := []database.View{}
		err := api.UpdateViewsLinkedStatus(db, parentCtx, &views, primitive.NewObjectID())
		assert.NoError(t, err)
		assert.Equal(t, 0, len(views))
	})
	t.Run("UpdateSingleLinkedView", func(t *testing.T) {
		views := []database.View{
			{
				UserID:   userID,
				IsLinked: true,
				Type:     "linear",
			},
		}
		err := api.UpdateViewsLinkedStatus(db, parentCtx, &views, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(views))
		assert.False(t, views[0].IsLinked)
	})
	t.Run("UpdateSingleUnlinkedView", func(t *testing.T) {
		views := []database.View{
			{
				UserID:   userID,
				IsLinked: false,
				Type:     "linear",
			},
		}
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		externalAPITokenCollection.InsertOne(dbCtx, database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: external.TaskServiceLinear.ID,
		})

		err := api.UpdateViewsLinkedStatus(db, parentCtx, &views, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(views))
		assert.True(t, views[0].IsLinked)
	})
	t.Run("LinkedViewStaysLinked", func(t *testing.T) {
		userID := primitive.NewObjectID()
		views := []database.View{
			{
				UserID:   userID,
				IsLinked: true,
				Type:     "linear",
			},
		}
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		externalAPITokenCollection.InsertOne(dbCtx, database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: external.TaskServiceLinear.ID,
		})

		err := api.UpdateViewsLinkedStatus(db, parentCtx, &views, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(views))
		assert.True(t, views[0].IsLinked)
	})
	t.Run("UnlinkedViewStaysUnlinked", func(t *testing.T) {
		userID := primitive.NewObjectID()
		views := []database.View{
			{
				UserID:   userID,
				IsLinked: false,
				Type:     "linear",
			},
		}

		err := api.UpdateViewsLinkedStatus(db, parentCtx, &views, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(views))
		assert.False(t, views[0].IsLinked)
	})
	t.Run("InvalidUserID", func(t *testing.T) {
		views := []database.View{
			{
				UserID: userID,
			},
		}
		err := api.UpdateViewsLinkedStatus(db, parentCtx, &views, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
	})
}

func TestIsServiceLinked(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	api, _ := GetAPI()

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
	t.Run("TaskServiceIsTrue", func(t *testing.T) {
		result, err := api.IsServiceLinked(db, parentCtx, userID, external.TASK_SERVICE_ID_GT)
		assert.NoError(t, err)
		assert.True(t, result)
	})
}

func TestOverviewModify(t *testing.T) {
	authToken := login("testModifyOverview@generaltask.com", "")

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, db, authToken)

	viewCollection := database.GetViewCollection(db)
	dbCtx, cancel := context.WithTimeout(context.Background(), constants.DatabaseTimeout)
	defer cancel()

	// Remove starter views
	viewCollection.DeleteMany(dbCtx, bson.M{"user_id": userID})

	dbCtx, cancel = context.WithTimeout(context.Background(), constants.DatabaseTimeout)
	defer cancel()
	insertViews := []interface{}{
		database.View{
			UserID:     userID,
			IDOrdering: 1,
		},
		database.View{
			UserID:     userID,
			IDOrdering: 2,
		},
		database.View{
			UserID:     userID,
			IDOrdering: 3,
		},
		// Note: this view uses a different user ID
		database.View{
			UserID:     primitive.NewObjectID(),
			IDOrdering: 1,
		},
	}
	result, err := viewCollection.InsertMany(dbCtx, insertViews)
	assert.NoError(t, err)
	assert.Equal(t, 4, len(result.InsertedIDs))

	firstViewID := result.InsertedIDs[0].(primitive.ObjectID)
	secondViewID := result.InsertedIDs[1].(primitive.ObjectID)
	thirdViewID := result.InsertedIDs[2].(primitive.ObjectID)
	fourthViewID := result.InsertedIDs[3].(primitive.ObjectID)

	t.Run("MissingIDOrdering", func(t *testing.T) {
		url := fmt.Sprintf("/overview/views/%s/", firstViewID.Hex())
		ServeRequest(t, authToken, "PATCH", url, nil, http.StatusBadRequest)
		checkViewPosition(t, viewCollection, firstViewID, 1)
		checkViewPosition(t, viewCollection, secondViewID, 2)
		checkViewPosition(t, viewCollection, thirdViewID, 3)
		checkViewPosition(t, viewCollection, fourthViewID, 1)
	})
	t.Run("InvalidViewID", func(t *testing.T) {
		ServeRequest(t, authToken, "PATCH", "/overview/views/1/", bytes.NewBuffer([]byte(`{"id_ordering": 1}`)), http.StatusNotFound)
		checkViewPosition(t, viewCollection, firstViewID, 1)
		checkViewPosition(t, viewCollection, secondViewID, 2)
		checkViewPosition(t, viewCollection, thirdViewID, 3)
		checkViewPosition(t, viewCollection, fourthViewID, 1)
	})
	t.Run("IncorrectViewID", func(t *testing.T) {
		viewID := primitive.NewObjectID()
		url := fmt.Sprintf("/overview/views/%s/", viewID.Hex())
		ServeRequest(t, authToken, "PATCH", url, bytes.NewBuffer([]byte(`{"id_ordering": 1}`)), http.StatusNotFound)
		checkViewPosition(t, viewCollection, firstViewID, 1)
		checkViewPosition(t, viewCollection, secondViewID, 2)
		checkViewPosition(t, viewCollection, thirdViewID, 3)
		checkViewPosition(t, viewCollection, fourthViewID, 1)
	})
	t.Run("SuccessInsertFirst", func(t *testing.T) {
		// Expected Result: [3, 1, 2]
		url := fmt.Sprintf("/overview/views/%s/", thirdViewID.Hex())
		ServeRequest(t, authToken, "PATCH", url, bytes.NewBuffer([]byte(`{"id_ordering": 1}`)), http.StatusOK)
		checkViewPosition(t, viewCollection, firstViewID, 2)
		checkViewPosition(t, viewCollection, secondViewID, 3)
		checkViewPosition(t, viewCollection, thirdViewID, 1)
		checkViewPosition(t, viewCollection, fourthViewID, 1)
	})
	t.Run("SuccessInsertSecond", func(t *testing.T) {
		// Expected Result: [1, 3, 2]
		url := fmt.Sprintf("/overview/views/%s/", thirdViewID.Hex())
		ServeRequest(t, authToken, "PATCH", url, bytes.NewBuffer([]byte(`{"id_ordering": 3}`)), http.StatusOK)
		checkViewPosition(t, viewCollection, firstViewID, 1)
		checkViewPosition(t, viewCollection, secondViewID, 3)
		checkViewPosition(t, viewCollection, thirdViewID, 2)
		checkViewPosition(t, viewCollection, fourthViewID, 1)
	})
	t.Run("SuccessInsertThird", func(t *testing.T) {
		// Expected Result: [1, 2, 3]
		url := fmt.Sprintf("/overview/views/%s/", thirdViewID.Hex())
		ServeRequest(t, authToken, "PATCH", url, bytes.NewBuffer([]byte(`{"id_ordering": 4}`)), http.StatusOK)
		checkViewPosition(t, viewCollection, firstViewID, 1)
		checkViewPosition(t, viewCollection, secondViewID, 2)
		checkViewPosition(t, viewCollection, thirdViewID, 3)
		checkViewPosition(t, viewCollection, fourthViewID, 1)
	})
}

func TestOverviewAdd(t *testing.T) {
	parentCtx := context.Background()
	authToken := login("testAddView@generaltask.com", "")

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID := getUserIDFromAuthToken(t, db, authToken)

	viewCollection := database.GetViewCollection(db)

	taskSectionCollection := database.GetTaskSectionCollection(db)

	taskSection1, err := taskSectionCollection.InsertOne(parentCtx, database.TaskSection{
		UserID: userID,
		Name:   "Duck section",
	})
	assert.NoError(t, err)
	taskSection1ID := taskSection1.InsertedID.(primitive.ObjectID).Hex()
	otherUserId := primitive.NewObjectID()
	taskSection2, err := taskSectionCollection.InsertOne(parentCtx, database.TaskSection{
		UserID: otherUserId,
		Name:   "Goose section",
	})
	assert.NoError(t, err)
	taskSection2ID := taskSection2.InsertedID.(primitive.ObjectID).Hex()

	t.Run("MissingAllParams", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(``)), http.StatusBadRequest)
		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("MissingType", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(fmt.Sprintf(`{"task_section_id": "%s"}`, taskSection1ID))), http.StatusBadRequest)
		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("InvalidType", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "invalid_type"}`)), http.StatusInternalServerError)
		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("MissingTaskSectionId", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "task_section"}`)), http.StatusBadRequest)
		assert.Equal(t, "{\"detail\":\"'task_section_id' is required for task section type views\"}", string(body))

		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("BadTaskSectionId", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "task_section", "task_section_id": "bruh"}`)), http.StatusInternalServerError)
		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("AddDuplicateView", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		var addedView database.View

		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(fmt.Sprintf(`{"type": "`+string(ViewTaskSection)+`", "task_section_id": "%s"}`, taskSection1ID))), http.StatusOK)
		taskSection1ObjectID, err := primitive.ObjectIDFromHex(taskSection1ID)
		assert.NoError(t, err)
		err = viewCollection.FindOne(parentCtx, bson.M{"user_id": userID, "task_section_id": taskSection1ObjectID}).Decode(&addedView)
		assert.NoError(t, err)
		assert.Equal(t, fmt.Sprintf(`{"id":"%s"}`, addedView.ID.Hex()), string(body))
		assert.Equal(t, database.View{
			ID:            addedView.ID,
			UserID:        userID,
			IDOrdering:    1,
			Type:          string(ViewTaskSection),
			IsLinked:      true,
			TaskSectionID: taskSection1ObjectID,
			GithubID:      "",
		}, addedView)

		ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(fmt.Sprintf(`{"type": "task_section", "task_section_id": "%s"}`, taskSection1ID))), http.StatusBadRequest)

		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("AddTaskSectionFromOtherUser", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(fmt.Sprintf(`{"type": "task_section", "task_section_id": "%s"}`, taskSection2ID))), http.StatusBadRequest)

		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("AddTaskSectionSuccess", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		var addedView database.View

		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(fmt.Sprintf(`{"type": "`+string(ViewTaskSection)+`", "task_section_id": "%s"}`, taskSection1ID))), http.StatusOK)
		taskSection1ObjectID, err := primitive.ObjectIDFromHex(taskSection1ID)
		assert.NoError(t, err)
		err = viewCollection.FindOne(parentCtx, bson.M{"user_id": userID, "task_section_id": taskSection1ObjectID}).Decode(&addedView)
		assert.NoError(t, err)
		assert.Equal(t, fmt.Sprintf(`{"id":"%s"}`, addedView.ID.Hex()), string(body))
		assert.Equal(t, database.View{
			ID:            addedView.ID,
			UserID:        userID,
			IDOrdering:    1,
			Type:          string(ViewTaskSection),
			IsLinked:      true,
			TaskSectionID: taskSection1ObjectID,
			GithubID:      "",
		}, addedView)

		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("AddLinearViewSuccess", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		var addedView database.View
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "`+string(ViewLinear)+`"}`)), http.StatusOK)
		err = viewCollection.FindOne(parentCtx, bson.M{"user_id": userID, "type": string(ViewLinear)}).Decode(&addedView)
		assert.NoError(t, err)
		assert.Equal(t, fmt.Sprintf(`{"id":"%s"}`, addedView.ID.Hex()), string(body))
		assert.Equal(t, database.View{
			ID:            addedView.ID,
			UserID:        userID,
			IDOrdering:    1,
			Type:          string(ViewLinear),
			IsLinked:      false,
			TaskSectionID: primitive.NilObjectID,
			GithubID:      "",
		}, addedView)

		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("AddSlackViewSuccess", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		var addedView database.View
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "`+string(ViewSlack)+`"}`)), http.StatusOK)
		err = viewCollection.FindOne(parentCtx, bson.M{"user_id": userID, "type": string(ViewSlack)}).Decode(&addedView)
		assert.NoError(t, err)
		assert.Equal(t, fmt.Sprintf(`{"id":"%s"}`, addedView.ID.Hex()), string(body))
		assert.Equal(t, database.View{
			ID:            addedView.ID,
			UserID:        userID,
			IDOrdering:    1,
			Type:          string(ViewSlack),
			IsLinked:      false,
			TaskSectionID: primitive.NilObjectID,
			GithubID:      "",
		}, addedView)

		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("AddGithubViewMissingGithubID", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "github"}`)), http.StatusBadRequest)
		assert.Equal(t, "{\"detail\":\"'id_github' is required for github type views\"}", string(body))

		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("AddGithubViewMalformattedGithubID", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "github", "github_id": 123}`)), http.StatusBadRequest)
		assert.Equal(t, "{\"detail\":\"invalid or missing parameter\"}", string(body))

		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("AddGithubViewInvalidGithubID", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "github", "github_id": "foobar"}`)), http.StatusBadRequest)
		assert.Equal(t, "{\"detail\":\"invalid 'id_github'\"}", string(body))

		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("AddGithubViewSuccess", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		_, err := createTestPullRequest(db, userID, "amc-to-the-moon", false, true, "", time.Now())
		assert.NoError(t, err)
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "`+string(ViewGithub)+`", "github_id": "amc-to-the-moon"}`)), http.StatusOK)
		var addedView database.View
		err = viewCollection.FindOne(parentCtx, bson.M{"user_id": userID, "type": string(ViewGithub)}).Decode(&addedView)
		assert.NoError(t, err)
		assert.Equal(t, fmt.Sprintf(`{"id":"%s"}`, addedView.ID.Hex()), string(body))
		assert.Equal(t, database.View{
			ID:            addedView.ID,
			UserID:        userID,
			IDOrdering:    1,
			Type:          string(ViewGithub),
			IsLinked:      false,
			TaskSectionID: primitive.NilObjectID,
			GithubID:      "amc-to-the-moon",
		}, addedView)

		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
}

func TestOverviewViewDelete(t *testing.T) {
	parentCtx := context.Background()
	authToken := login("testDeleteView@generaltask.com", "")

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	viewCollection := database.GetViewCollection(db)
	userID := getUserIDFromAuthToken(t, db, authToken)
	view, err := viewCollection.InsertOne(parentCtx, database.View{
		UserID: userID,
	})
	assert.NoError(t, err)
	viewID := view.InsertedID.(primitive.ObjectID)

	t.Run("InvalidViewID", func(t *testing.T) {
		ServeRequest(t, authToken, "DELETE", "/overview/views/1/", nil, http.StatusNotFound)
		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"_id": viewID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("IncorrectViewID", func(t *testing.T) {
		incorrectViewID := primitive.NewObjectID()
		url := fmt.Sprintf("/overview/views/%s/", incorrectViewID.Hex())
		ServeRequest(t, authToken, "DELETE", url, nil, http.StatusNotFound)

		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"_id": viewID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("InvalidUserID", func(t *testing.T) {
		url := fmt.Sprintf("/overview/views/%s/", viewID.Hex())
		authToken := "invalidAuthToken"
		ServeRequest(t, authToken, "DELETE", url, nil, http.StatusUnauthorized)

		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"_id": viewID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("Success", func(t *testing.T) {
		url := fmt.Sprintf("/overview/views/%s/", viewID.Hex())
		ServeRequest(t, authToken, "DELETE", url, nil, http.StatusOK)

		count, err := viewCollection.CountDocuments(parentCtx, bson.M{"_id": viewID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
}

func TestOverviewSupportedViewsList(t *testing.T) {
	parentCtx := context.Background()
	authToken := login("TestOverviewSupportedViewsList@generaltask.com", "")

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID := getUserIDFromAuthToken(t, db, authToken)
	viewCollection := database.GetViewCollection(db)
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	taskSectionCollection := database.GetTaskSectionCollection(db)
	taskSection, err := taskSectionCollection.InsertOne(parentCtx, database.TaskSection{
		UserID: userID,
		Name:   "Duck section",
	})
	assert.NoError(t, err)
	taskSectionObjectID := taskSection.InsertedID.(primitive.ObjectID)
	taskSectionID := taskSectionObjectID.Hex()

	UnauthorizedTest(t, "GET", "/overview/supported_views/", nil)
	t.Run("TestNoViewsAdded", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		externalAPITokenCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		body := ServeRequest(t, authToken, "GET", "/overview/supported_views/", nil, http.StatusOK)

		expectedBody := fmt.Sprintf("[{\"type\":\"task_section\",\"name\":\"Task Sections\",\"logo\":\"generaltask\",\"is_nested\":true,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Default\",\"is_added\":false,\"task_section_id\":\"000000000000000000000001\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"},{\"name\":\"Duck section\",\"is_added\":false,\"task_section_id\":\"%s\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"linear\",\"name\":\"Linear\",\"logo\":\"linear\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/linear/\",\"views\":[{\"name\":\"Linear View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"slack\",\"name\":\"Slack\",\"logo\":\"slack\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/slack/\",\"views\":[{\"name\":\"Slack View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"github\",\"name\":\"GitHub\",\"logo\":\"github\",\"is_nested\":true,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/github/\",\"views\":[]}]", taskSectionID)
		assert.Equal(t, expectedBody, string(body))
	})
	t.Run("TestTaskSectionIsAdded", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		externalAPITokenCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		view, err := viewCollection.InsertOne(parentCtx, database.View{
			UserID:        userID,
			Type:          "task_section",
			IsLinked:      false,
			TaskSectionID: taskSectionObjectID,
		})
		assert.NoError(t, err)
		addedViewId := view.InsertedID.(primitive.ObjectID).Hex()
		body := ServeRequest(t, authToken, "GET", "/overview/supported_views/", nil, http.StatusOK)
		expectedBody := fmt.Sprintf("[{\"type\":\"task_section\",\"name\":\"Task Sections\",\"logo\":\"generaltask\",\"is_nested\":true,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Default\",\"is_added\":false,\"task_section_id\":\"000000000000000000000001\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"},{\"name\":\"Duck section\",\"is_added\":true,\"task_section_id\":\"%s\",\"github_id\":\"\",\"view_id\":\"%s\"}]},{\"type\":\"linear\",\"name\":\"Linear\",\"logo\":\"linear\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/linear/\",\"views\":[{\"name\":\"Linear View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"slack\",\"name\":\"Slack\",\"logo\":\"slack\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/slack/\",\"views\":[{\"name\":\"Slack View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"github\",\"name\":\"GitHub\",\"logo\":\"github\",\"is_nested\":true,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/github/\",\"views\":[]}]", taskSectionID, addedViewId)
		assert.Equal(t, expectedBody, string(body))
	})
	t.Run("TestLinearIsAddedIsUnlinked", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		externalAPITokenCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		view, err := viewCollection.InsertOne(parentCtx, database.View{
			UserID:   userID,
			Type:     "linear",
			IsLinked: false,
		})
		assert.NoError(t, err)
		addedViewId := view.InsertedID.(primitive.ObjectID).Hex()
		body := ServeRequest(t, authToken, "GET", "/overview/supported_views/", nil, http.StatusOK)
		expectedBody := fmt.Sprintf("[{\"type\":\"task_section\",\"name\":\"Task Sections\",\"logo\":\"generaltask\",\"is_nested\":true,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Default\",\"is_added\":false,\"task_section_id\":\"000000000000000000000001\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"},{\"name\":\"Duck section\",\"is_added\":false,\"task_section_id\":\"%s\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"linear\",\"name\":\"Linear\",\"logo\":\"linear\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/linear/\",\"views\":[{\"name\":\"Linear View\",\"is_added\":true,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"%s\"}]},{\"type\":\"slack\",\"name\":\"Slack\",\"logo\":\"slack\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/slack/\",\"views\":[{\"name\":\"Slack View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"github\",\"name\":\"GitHub\",\"logo\":\"github\",\"is_nested\":true,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/github/\",\"views\":[]}]", taskSectionID, addedViewId)
		assert.Equal(t, expectedBody, string(body))
	})
	t.Run("TestLinearIsAddedIsLinked", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		externalAPITokenCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		view, err := viewCollection.InsertOne(parentCtx, database.View{
			UserID:   userID,
			Type:     "linear",
			IsLinked: true,
		})
		assert.NoError(t, err)
		addedViewId := view.InsertedID.(primitive.ObjectID).Hex()
		externalAPITokenCollection.InsertOne(parentCtx, database.ExternalAPIToken{
			UserID:    userID,
			Token:     "testtoken",
			ServiceID: external.TASK_SERVICE_ID_LINEAR,
		})
		body := ServeRequest(t, authToken, "GET", "/overview/supported_views/", nil, http.StatusOK)
		expectedBody := fmt.Sprintf("[{\"type\":\"task_section\",\"name\":\"Task Sections\",\"logo\":\"generaltask\",\"is_nested\":true,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Default\",\"is_added\":false,\"task_section_id\":\"000000000000000000000001\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"},{\"name\":\"Duck section\",\"is_added\":false,\"task_section_id\":\"%s\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"linear\",\"name\":\"Linear\",\"logo\":\"linear\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Linear View\",\"is_added\":true,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"%s\"}]},{\"type\":\"slack\",\"name\":\"Slack\",\"logo\":\"slack\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/slack/\",\"views\":[{\"name\":\"Slack View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"github\",\"name\":\"GitHub\",\"logo\":\"github\",\"is_nested\":true,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/github/\",\"views\":[]}]", taskSectionID, addedViewId)
		assert.Equal(t, expectedBody, string(body))
	})
	t.Run("TestSlackIsAddedIsUnlinked", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		externalAPITokenCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		view, err := viewCollection.InsertOne(parentCtx, database.View{
			UserID:   userID,
			Type:     "slack",
			IsLinked: false,
		})
		assert.NoError(t, err)
		addedViewId := view.InsertedID.(primitive.ObjectID).Hex()
		body := ServeRequest(t, authToken, "GET", "/overview/supported_views/", nil, http.StatusOK)
		expectedBody := fmt.Sprintf("[{\"type\":\"task_section\",\"name\":\"Task Sections\",\"logo\":\"generaltask\",\"is_nested\":true,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Default\",\"is_added\":false,\"task_section_id\":\"000000000000000000000001\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"},{\"name\":\"Duck section\",\"is_added\":false,\"task_section_id\":\"%s\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"linear\",\"name\":\"Linear\",\"logo\":\"linear\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/linear/\",\"views\":[{\"name\":\"Linear View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"slack\",\"name\":\"Slack\",\"logo\":\"slack\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/slack/\",\"views\":[{\"name\":\"Slack View\",\"is_added\":true,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"%s\"}]},{\"type\":\"github\",\"name\":\"GitHub\",\"logo\":\"github\",\"is_nested\":true,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/github/\",\"views\":[]}]", taskSectionID, addedViewId)
		assert.Equal(t, expectedBody, string(body))
	})
	t.Run("TestSlackIsAddedIsLinked", func(t *testing.T) {
		viewCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		externalAPITokenCollection.DeleteMany(parentCtx, bson.M{"user_id": userID})
		view, err := viewCollection.InsertOne(parentCtx, database.View{
			UserID:   userID,
			Type:     "slack",
			IsLinked: false,
		})
		assert.NoError(t, err)
		addedViewId := view.InsertedID.(primitive.ObjectID).Hex()
		externalAPITokenCollection.InsertOne(parentCtx, database.ExternalAPIToken{
			UserID:    userID,
			Token:     "testtoken",
			ServiceID: external.TASK_SERVICE_ID_SLACK,
		})
		body := ServeRequest(t, authToken, "GET", "/overview/supported_views/", nil, http.StatusOK)
		expectedBody := fmt.Sprintf("[{\"type\":\"task_section\",\"name\":\"Task Sections\",\"logo\":\"generaltask\",\"is_nested\":true,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Default\",\"is_added\":false,\"task_section_id\":\"000000000000000000000001\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"},{\"name\":\"Duck section\",\"is_added\":false,\"task_section_id\":\"%s\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"linear\",\"name\":\"Linear\",\"logo\":\"linear\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/linear/\",\"views\":[{\"name\":\"Linear View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"slack\",\"name\":\"Slack\",\"logo\":\"slack\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Slack View\",\"is_added\":true,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"%s\"}]},{\"type\":\"github\",\"name\":\"GitHub\",\"logo\":\"github\",\"is_nested\":true,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/github/\",\"views\":[]}]", taskSectionID, addedViewId)
		assert.Equal(t, expectedBody, string(body))
	})
}

func assertOverviewViewResultEqual[T ViewItem](t *testing.T, expected OverviewResult[T], actual OverviewResult[T]) {
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
		expectedViewItem := *(expected.ViewItems[i])
		actualViewItem := *(actual.ViewItems[i])
		assert.Equal(t, expectedViewItem.GetID(), actualViewItem.GetID())
	}
}

func checkViewPosition(t *testing.T, viewCollection *mongo.Collection, viewID primitive.ObjectID, position int) {
	var view database.View
	dbCtx, cancel := context.WithTimeout(context.Background(), constants.DatabaseTimeout)
	defer cancel()
	err := viewCollection.FindOne(dbCtx, bson.M{"_id": viewID}).Decode(&view)
	assert.NoError(t, err)
	assert.Equal(t, position, view.IDOrdering)
}
