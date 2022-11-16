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
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)
	UnauthorizedTest(t, "GET", "/overview/views/", nil)
	t.Run("SuccessGetViews", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/overview/views/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)
		request.Header.Set("Timezone-Offset", "420")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		regex := `\[{"id":"[a-z0-9]{24}","name":"Task Inbox","type":"task_section","logo":"generaltask","is_linked":true,"sources":\[\],"task_section_id":"000000000000000000000001","is_reorderable":true,"ordering_id":1,"view_items":\[{"id":"[a-z0-9]{24}","id_ordering":1,"source":{"name":"General Task","logo":"\/images\/generaltask.svg","logo_v2":"generaltask","is_completable":true,"is_replyable":false},"deeplink":"","title":"Put tasks on your calendar with click-and-drag","body":"","sender":"","due_date":"","priority_normalized":0,"time_allocated":0,"sent_at":"20.*Z","is_done":false,"is_deleted":false,"is_meeting_preparation_task":false,"nux_number_id":1,"created_at":"20.*Z","updated_at":"1970-01-01T00:00:00Z"},{"id":"[a-z0-9]{24}","id_ordering":2,"source":{"name":"General Task","logo":"\/images\/generaltask.svg","logo_v2":"generaltask","is_completable":true,"is_replyable":false},"deeplink":"","title":"Shut out distractions with Focus Mode","body":"","sender":"","due_date":"","priority_normalized":0,"time_allocated":0,"sent_at":"20.*Z","is_done":false,"is_deleted":false,"is_meeting_preparation_task":false,"nux_number_id":2,"created_at":"20.*Z","updated_at":"1970-01-01T00:00:00Z"},{"id":"[a-z0-9]{24}","id_ordering":3,"source":{"name":"General Task","logo":"\/images\/generaltask.svg","logo_v2":"generaltask","is_completable":true,"is_replyable":false},"deeplink":"","title":"Connect other services to see things in one place","body":"","sender":"","due_date":"","priority_normalized":0,"time_allocated":0,"sent_at":"20.*Z","is_done":false,"is_deleted":false,"is_meeting_preparation_task":false,"nux_number_id":3,"created_at":"20.*Z","updated_at":"1970-01-01T00:00:00Z"},{"id":"[a-z0-9]{24}","id_ordering":4,"source":{"name":"General Task","logo":"\/images\/generaltask.svg","logo_v2":"generaltask","is_completable":true,"is_replyable":false},"deeplink":"","title":"A sincere thank you from the team","body":"","sender":"","due_date":"","priority_normalized":0,"time_allocated":0,"sent_at":"20.*Z","is_done":false,"is_deleted":false,"is_meeting_preparation_task":false,"nux_number_id":4,"created_at":"20.*Z","updated_at":"1970-01-01T00:00:00Z"}]},{"id":"[a-z0-9]{24}","name":"Linear Issues","type":"linear","logo":"linear","is_linked":false,"sources":\[{"name":"Linear","authorization_url":"http://localhost:8080/link/linear/"}],"task_section_id":"000000000000000000000000","is_reorderable":false,"ordering_id":2,"view_items":\[\]},{"id":"[a-z0-9]{24}","name":"Slack Messages","type":"slack","logo":"slack","is_linked":false,"sources":\[{"name":"Slack","authorization_url":"http://localhost:8080/link/slack/"}\],"task_section_id":"000000000000000000000000","is_reorderable":false,"ordering_id":3,"view_items":\[\]}]`
		assert.Regexp(t, regex, string(body))
	})
	t.Run("NoViews", func(t *testing.T) {
		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		viewCollection := database.GetViewCollection(db)
		viewCollection.DeleteMany(context.Background(), bson.M{})

		request, _ := http.NewRequest("GET", "/overview/views/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)
		request.Header.Set("Timezone-Offset", "420")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "[]", string(body))
	})
	t.Run("MissingTimezoneOffsetHeader", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/overview/views/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, `{"error":"Timezone-Offset header is required"}`, string(body))
	})
}

func TestGetOverviewResults(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	t.Run("NoViews", func(t *testing.T) {
		result, err := api.GetOverviewResults([]database.View{}, primitive.NewObjectID(), 0)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, 0, len(result))
	})
	t.Run("InvalidViewType", func(t *testing.T) {
		result, err := api.GetOverviewResults([]database.View{{
			Type: "invalid",
		}}, primitive.NewObjectID(), 0)
		assert.Error(t, err)
		assert.Equal(t, "invalid view type", err.Error())
		assert.Nil(t, result)
	})
	t.Run("SingleTaskSection", func(t *testing.T) {
		userID := primitive.NewObjectID()
		taskSectionName := "Test Task Section"

		taskSectionCollection := database.GetTaskSectionCollection(api.DB)
		taskSectionResult, err := taskSectionCollection.InsertOne(context.Background(), database.TaskSection{
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

		taskCollection := database.GetTaskCollection(api.DB)
		isCompleted := false
		taskResult, err := taskCollection.InsertOne(context.Background(), database.Task{
			UserID:        userID,
			IsCompleted:   &isCompleted,
			IDTaskSection: taskSectionID,
			SourceID:      external.TASK_SOURCE_ID_GT_TASK,
		})
		assert.NoError(t, err)

		result, err := api.GetOverviewResults(views, userID, 0)
		expectedViewResult := OverviewResult[TaskResult]{
			ID:            views[0].ID,
			Name:          taskSectionName,
			Type:          constants.ViewTaskSection,
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
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	taskSectionName := "Test Task Section"
	userID := primitive.NewObjectID()
	taskSectionCollection := database.GetTaskSectionCollection(db)
	taskSectionResult, err := taskSectionCollection.InsertOne(context.Background(), database.TaskSection{
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
	_, err = viewCollection.InsertOne(context.Background(), view)
	assert.NoError(t, err)
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	expectedViewResult := OverviewResult[TaskResult]{
		ID:            view.ID,
		Name:          taskSectionName,
		Type:          constants.ViewTaskSection,
		Logo:          "generaltask",
		IsLinked:      false,
		Sources:       []SourcesResult{},
		IsReorderable: false,
		IDOrdering:    1,
		TaskSectionID: taskSectionID,
	}

	t.Run("EmptyViewItems", func(t *testing.T) {
		result, err := api.GetTaskSectionOverviewResult(view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.ViewItems = []*TaskResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
	t.Run("SuccessTaskViewItems", func(t *testing.T) {
		taskCollection := database.GetTaskCollection(api.DB)
		isCompleted := false
		items := []interface{}{
			database.Task{
				UserID:        userID,
				IsCompleted:   &isCompleted,
				IDTaskSection: taskSectionID,
				SourceID:      external.TASK_SOURCE_ID_GT_TASK,
				IDOrdering:    4,
			},
			database.Task{
				UserID:        userID,
				IsCompleted:   &isCompleted,
				IDTaskSection: taskSectionID,
				SourceID:      external.TASK_SOURCE_ID_GT_TASK,
				IDOrdering:    2,
			},
			database.Task{
				UserID:        userID,
				IsCompleted:   &isCompleted,
				IDTaskSection: taskSectionID,
				SourceID:      external.TASK_SOURCE_ID_GT_TASK,
				IDOrdering:    3,
			},
			// shouldn't appear in overview result because subtask
			database.Task{
				UserID:        userID,
				IsCompleted:   &isCompleted,
				IDTaskSection: taskSectionID,
				SourceID:      external.TASK_SOURCE_ID_GT_TASK,
				IDOrdering:    4,
				ParentTaskID:  primitive.NewObjectID(),
			},
		}
		taskResult, err := taskCollection.InsertMany(context.Background(), items)
		assert.NoError(t, err)
		assert.Equal(t, 4, len(taskResult.InsertedIDs))
		firstTaskID := taskResult.InsertedIDs[0].(primitive.ObjectID)
		secondTaskID := taskResult.InsertedIDs[1].(primitive.ObjectID)
		thirdTaskID := taskResult.InsertedIDs[2].(primitive.ObjectID)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		result, err := api.GetTaskSectionOverviewResult(view, userID)
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
		result, err := api.GetTaskSectionOverviewResult(view, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
		assert.Nil(t, result)
	})
	t.Run("InvalidSectionIDGracefullyHandled", func(t *testing.T) {
		view.TaskSectionID = primitive.NewObjectID()
		result, err := api.GetTaskSectionOverviewResult(view, userID)
		assert.NoError(t, err)
		assert.Nil(t, result)
	})
}

func TestGetLinearOverviewResult(t *testing.T) {
	userID := primitive.NewObjectID()
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	externalAPITokenCollection := database.GetExternalTokenCollection(api.DB)
	_, err := externalAPITokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
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
	viewCollection := database.GetViewCollection(api.DB)
	_, err = viewCollection.InsertOne(context.Background(), view)
	assert.NoError(t, err)

	authURL := "http://localhost:8080/link/linear/"
	expectedViewResult := OverviewResult[TaskResult]{
		ID:            view.ID,
		Name:          "Linear Issues",
		Type:          constants.ViewLinear,
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
		result, err := api.GetLinearOverviewResult(view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.ViewItems = []*TaskResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
	t.Run("SingleLinearViewItem", func(t *testing.T) {
		taskCollection := database.GetTaskCollection(api.DB)
		notCompleted := false
		completed := true
		taskResult, err := taskCollection.InsertOne(context.Background(), database.Task{
			UserID:        userID,
			IsCompleted:   &notCompleted,
			IDTaskSection: primitive.NilObjectID,
			SourceID:      external.TASK_SOURCE_ID_LINEAR,
		})
		assert.NoError(t, err)

		// Insert completed Linear task. This task should not be in the view result.
		_, err = taskCollection.InsertOne(context.Background(), database.Task{
			UserID:        userID,
			IsCompleted:   &completed,
			IDTaskSection: primitive.NilObjectID,
			SourceID:      external.TASK_SOURCE_ID_LINEAR,
		})
		assert.NoError(t, err)

		// Insert completed Linear subtask. This task should not be in the view result.
		_, err = taskCollection.InsertOne(context.Background(), database.Task{
			UserID:        userID,
			IsCompleted:   &completed,
			IDTaskSection: primitive.NilObjectID,
			SourceID:      external.TASK_SOURCE_ID_LINEAR,
			ParentTaskID:  primitive.NewObjectID(),
		})
		assert.NoError(t, err)

		// Insert task with different source. This task should not be in the view result.
		_, err = taskCollection.InsertOne(context.Background(), database.Task{
			UserID:        userID,
			IsCompleted:   &notCompleted,
			IDTaskSection: primitive.NilObjectID,
			SourceID:      "randomSource",
		})
		assert.NoError(t, err)

		// Insert Linear task with different UserID. This task should not be in the view result.
		_, err = taskCollection.InsertOne(context.Background(), database.Task{
			UserID:        primitive.NewObjectID(),
			IsCompleted:   &notCompleted,
			IDTaskSection: primitive.NilObjectID,
			SourceID:      external.TASK_SOURCE_ID_LINEAR,
		})
		assert.NoError(t, err)

		taskID := taskResult.InsertedID.(primitive.ObjectID)
		result, err := api.GetLinearOverviewResult(view, userID)
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
		result, err := api.GetLinearOverviewResult(view, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
		assert.Nil(t, result)
	})
	t.Run("ViewNotLinked", func(t *testing.T) {
		view.IsLinked = false
		result, err := api.GetLinearOverviewResult(view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.IsLinked = false
		expectedViewResult.ViewItems = []*TaskResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
}

func TestGetSlackOverviewResult(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	userID := primitive.NewObjectID()
	externalAPITokenCollection := database.GetExternalTokenCollection(api.DB)
	_, err := externalAPITokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
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
	viewCollection := database.GetViewCollection(api.DB)
	_, err = viewCollection.InsertOne(context.Background(), view)
	assert.NoError(t, err)
	authURL := "http://localhost:8080/link/slack/"
	expectedViewResult := OverviewResult[TaskResult]{
		ID:       view.ID,
		Name:     "Slack Messages",
		Type:     constants.ViewSlack,
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
		result, err := api.GetSlackOverviewResult(view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.ViewItems = []*TaskResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
	t.Run("SingleSlackViewItem", func(t *testing.T) {
		taskCollection := database.GetTaskCollection(api.DB)
		notCompleted := false
		completed := true
		deleted := true
		taskResult, err := taskCollection.InsertOne(context.Background(), database.Task{
			UserID:        userID,
			IsCompleted:   &notCompleted,
			IDTaskSection: primitive.NilObjectID,
			SourceID:      external.TASK_SOURCE_ID_SLACK_SAVED,
		})
		assert.NoError(t, err)
		_, err = taskCollection.InsertOne(context.Background(), database.Task{
			UserID:        userID,
			IsCompleted:   &completed,
			IDTaskSection: primitive.NilObjectID,
			SourceID:      external.TASK_SOURCE_ID_SLACK_SAVED,
		})
		assert.NoError(t, err)
		_, err = taskCollection.InsertOne(context.Background(), database.Task{
			UserID:        userID,
			IsCompleted:   &notCompleted,
			IDTaskSection: primitive.NilObjectID,
			SourceID:      "randomSource",
		})
		assert.NoError(t, err)
		_, err = taskCollection.InsertOne(context.Background(), database.Task{
			UserID:        userID,
			IsCompleted:   &notCompleted,
			IDTaskSection: primitive.NilObjectID,
			SourceID:      external.TASK_SOURCE_ID_SLACK_SAVED,
			ParentTaskID:  primitive.NewObjectID(),
		})
		assert.NoError(t, err)
		_, err = taskCollection.InsertOne(context.Background(), database.Task{
			UserID:        primitive.NewObjectID(),
			IsCompleted:   &notCompleted,
			IDTaskSection: primitive.NilObjectID,
			SourceID:      external.TASK_SOURCE_ID_SLACK_SAVED,
		})
		assert.NoError(t, err)
		_, err = taskCollection.InsertOne(context.Background(), database.Task{
			UserID:        userID,
			IsDeleted:     &deleted,
			IsCompleted:   &notCompleted,
			IDTaskSection: primitive.NilObjectID,
			SourceID:      external.TASK_SOURCE_ID_SLACK_SAVED,
		})
		assert.NoError(t, err)

		taskID := taskResult.InsertedID.(primitive.ObjectID)
		result, err := api.GetSlackOverviewResult(view, userID)
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
		result, err := api.GetSlackOverviewResult(view, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
		assert.Nil(t, result)
	})
	t.Run("ViewNotLinked", func(t *testing.T) {
		view.IsLinked = false
		result, err := api.GetSlackOverviewResult(view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.IsLinked = false
		expectedViewResult.ViewItems = []*TaskResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
}

func TestGetGithubOverviewResult(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userID := primitive.NewObjectID()
	externalAPITokenCollection := database.GetExternalTokenCollection(api.DB)
	_, err := externalAPITokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
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
	repositoryCollection := database.GetRepositoryCollection(api.DB)
	// wrong user id
	_, err = repositoryCollection.InsertOne(context.Background(), database.Repository{
		UserID:       primitive.NewObjectID(),
		RepositoryID: githubID.Hex(),
		FullName:     "OrganizationTest/RepositoryTestWrong",
	})
	assert.NoError(t, err)
	// wrong repository id
	_, err = repositoryCollection.InsertOne(context.Background(), database.Repository{
		UserID:       userID,
		RepositoryID: primitive.NewObjectID().Hex(),
		FullName:     "OrganizationTest/RepositoryTestWrongAlso",
	})
	assert.NoError(t, err)
	_, err = repositoryCollection.InsertOne(context.Background(), database.Repository{
		UserID:       userID,
		RepositoryID: githubID.Hex(),
		FullName:     "OrganizationTest/RepositoryTest",
	})
	assert.NoError(t, err)
	viewCollection := database.GetViewCollection(api.DB)
	_, err = viewCollection.InsertOne(context.Background(), view)
	assert.NoError(t, err)

	authURL := "http://localhost:8080/link/github/"
	expectedViewResult := OverviewResult[PullRequestResult]{
		ID:       view.ID,
		Name:     "GitHub PRs from OrganizationTest/RepositoryTest",
		Type:     constants.ViewGithub,
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
		result, err := api.GetGithubOverviewResult(view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.ViewItems = []*PullRequestResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
	t.Run("Success", func(t *testing.T) {
		pullRequestCollection := database.GetPullRequestCollection(api.DB)
		falseBool := false
		trueBool := true
		commentCreatedAtTime, _ := time.Parse(time.RFC3339, "2022-04-20T19:01:12Z")
		commentCreatedAt := primitive.NewDateTimeFromTime(commentCreatedAtTime)
		pullResult, err := pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
			Body:           "oh no oh jeez",
			UserID:         userID,
			IsCompleted:    &falseBool,
			SourceID:       external.TASK_SOURCE_ID_GITHUB_PR,
			RepositoryID:   githubID.Hex(),
			RequiredAction: external.ActionAddReviewers,
			Comments: []database.PullRequestComment{{
				Type:            constants.COMMENT_TYPE_INLINE,
				Body:            "This is a comment",
				Author:          "chad1616",
				Filepath:        "tothemoon.txt",
				LineNumberStart: 69,
				LineNumberEnd:   420,
				CreatedAt:       commentCreatedAt,
			}},
			Additions: 690,
			Deletions: 42,
		})
		assert.NoError(t, err)
		pullResult2, err := pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
			UserID:         userID,
			IsCompleted:    &falseBool,
			SourceID:       external.TASK_SOURCE_ID_GITHUB_PR,
			RepositoryID:   githubID.Hex(),
			RequiredAction: external.ActionNoneNeeded,
		})
		assert.NoError(t, err)
		pullResult3, err := pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
			UserID:         userID,
			IsCompleted:    &falseBool,
			SourceID:       external.TASK_SOURCE_ID_GITHUB_PR,
			RepositoryID:   githubID.Hex(),
			RequiredAction: external.ActionMergePR,
		})
		assert.NoError(t, err)
		// Insert Github PR with different UserID. This PR should not be in the view result.
		_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
			UserID:      primitive.NewObjectID(),
			IsCompleted: &falseBool,
			SourceID:    external.TASK_SOURCE_ID_GITHUB_PR,
		})
		assert.NoError(t, err)
		// Insert completed Github PR. This PR should not be in the view result.
		_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
			UserID:      userID,
			IsCompleted: &trueBool,
			SourceID:    external.TASK_SOURCE_ID_GITHUB_PR,
		})
		assert.NoError(t, err)
		// Insert Github PR with different RepositoryID. This PR should not be in the view result.
		_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
			UserID:       userID,
			IsCompleted:  &falseBool,
			SourceID:     external.TASK_SOURCE_ID_GITHUB_PR,
			RepositoryID: primitive.NewObjectID().Hex(),
		})
		assert.NoError(t, err)

		pullRequestID := pullResult.InsertedID.(primitive.ObjectID)
		pullRequestID2 := pullResult2.InsertedID.(primitive.ObjectID)
		pullRequestID3 := pullResult3.InsertedID.(primitive.ObjectID)
		result, err := api.GetGithubOverviewResult(view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		// verify sorting is happening (more thorough tests exists for the PR endpoint)
		expectedViewResult.ViewItems = []*PullRequestResult{
			{
				ID:   pullRequestID.Hex(),
				Body: "oh no oh jeez",
				Comments: []PullRequestComment{{
					Type:            constants.COMMENT_TYPE_INLINE,
					Body:            "This is a comment",
					Author:          "chad1616",
					Filepath:        "tothemoon.txt",
					LineNumberStart: 69,
					LineNumberEnd:   420,
					CreatedAt:       "2022-04-20T19:01:12Z",
				}},
				Additions: 690,
				Deletions: 42,
			},
			{ID: pullRequestID3.Hex()},
			{ID: pullRequestID2.Hex()},
		}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
		assert.Equal(t, expectedViewResult.ViewItems[0].Body, result.ViewItems[0].Body)
		assert.Equal(t, expectedViewResult.ViewItems[0].Comments, result.ViewItems[0].Comments)
	})
	t.Run("InvalidUser", func(t *testing.T) {
		result, err := api.GetGithubOverviewResult(view, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
		assert.Nil(t, result)
	})
	t.Run("ViewNotLinked", func(t *testing.T) {
		view.IsLinked = false
		result, err := api.GetGithubOverviewResult(view, userID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.IsLinked = false
		expectedViewResult.ViewItems = []*PullRequestResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
}

func TestGetMeetingPreparationOverviewResult(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	view := database.View{UserID: userID}
	taskCollection := database.GetTaskCollection(db)
	calendarEventCollection := database.GetCalendarEventCollection(db)

	// Set artificial time for testing
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	testTime := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)
	timezoneOffset := time.Hour * 12
	api.OverrideTime = &testTime

	timeOneHourAgo := api.GetCurrentTime().Add(-1 * time.Hour)
	timeOneHourLater := api.GetCurrentTime().Add(1 * time.Hour)
	timeTwoHoursLater := api.GetCurrentTime().Add(2 * time.Hour)
	// given the 12 hour timezone offset, 13 hours ahead of time should be the next day
	timeEarlyTomorrow := api.GetCurrentTime().Add(13 * time.Hour)
	timeOneDayLater := api.GetCurrentTime().Add(24 * time.Hour)
	timeZero := time.Date(0, 0, 0, 0, 0, 0, 0, time.UTC)

	t.Run("InvalidUser", func(t *testing.T) {
		res, err := api.GetMeetingPreparationOverviewResult(view, primitive.NewObjectID(), timezoneOffset)
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
		assert.Nil(t, res)
	})
	t.Run("NoEvents", func(t *testing.T) {
		res, err := api.GetMeetingPreparationOverviewResult(view, userID, timezoneOffset)
		assert.NoError(t, err)
		assert.NotNil(t, res)
		assert.Equal(t, 0, len(res.ViewItems))
	})
	t.Run("EventStartTimeHasPassed", func(t *testing.T) {
		_, err := createTestEvent(calendarEventCollection, userID, "coffee", primitive.NewObjectID().Hex(), timeOneHourAgo, timeOneHourLater, primitive.NilObjectID)
		assert.NoError(t, err)
		res, err := api.GetMeetingPreparationOverviewResult(view, userID, timezoneOffset)
		assert.NoError(t, err)
		assert.NotNil(t, res)
		assert.Equal(t, 0, len(res.ViewItems))
	})
	t.Run("EventStartTimeIsNextDay", func(t *testing.T) {
		_, err := createTestEvent(calendarEventCollection, userID, "get donuts", primitive.NewObjectID().Hex(), timeOneDayLater, timeOneDayLater, primitive.NilObjectID)
		assert.NoError(t, err)
		_, err = createTestEvent(calendarEventCollection, userID, "chat", primitive.NewObjectID().Hex(), timeEarlyTomorrow, timeEarlyTomorrow, primitive.NilObjectID)
		assert.NoError(t, err)
		res, err := api.GetMeetingPreparationOverviewResult(view, userID, timezoneOffset)
		assert.NoError(t, err)
		assert.NotNil(t, res)
		assert.Equal(t, 0, len(res.ViewItems))
	})
	t.Run("EventStartTimeIsInValidRange", func(t *testing.T) {
		_, err := createTestEvent(calendarEventCollection, userID, "Event1", primitive.NewObjectID().Hex(), timeOneHourLater, timeOneDayLater, primitive.NilObjectID)
		assert.NoError(t, err)
		// shouldn't show task to cal events
		_, err = createTestEvent(calendarEventCollection, userID, "EventTask", primitive.NewObjectID().Hex(), timeOneHourLater, timeOneDayLater, primitive.NewObjectID())
		assert.NoError(t, err)
		res, err := api.GetMeetingPreparationOverviewResult(view, userID, timezoneOffset)
		assert.NoError(t, err)
		assert.NotNil(t, res)
		assert.Equal(t, 1, len(res.ViewItems))
		assert.Equal(t, "Event1", res.ViewItems[0].Title)
		// shouldn't set the body to anything
		assert.Equal(t, "", res.ViewItems[0].Body)
	})
	t.Run("MeetingPrepTaskAlreadyExists", func(t *testing.T) {
		idExternal := primitive.NewObjectID().Hex()
		insertResult, err := createTestEvent(calendarEventCollection, userID, "Event2", idExternal, timeTwoHoursLater, timeOneDayLater, primitive.NilObjectID)
		assert.NoError(t, err)

		_, err = createTestMeetingPreparationTask(taskCollection, userID, "Event2", idExternal, false, timeTwoHoursLater, timeOneDayLater, insertResult.InsertedID.(primitive.ObjectID))
		assert.NoError(t, err)

		res, err := api.GetMeetingPreparationOverviewResult(view, userID, timezoneOffset)
		assert.NoError(t, err)
		assert.NotNil(t, res)
		assert.Equal(t, 2, len(res.ViewItems))
		assert.Equal(t, "Event1", res.ViewItems[0].Title)
		assert.Equal(t, "Event2", res.ViewItems[1].Title)
		// shouldn't update the body to anything
		assert.Equal(t, "", res.ViewItems[0].Body)
	})
	t.Run("MeetingHasEnded", func(t *testing.T) {
		insertResult, err := createTestMeetingPreparationTask(taskCollection, userID, "reticulate splines", primitive.NewObjectID().Hex(), false, timeZero, timeZero, primitive.NilObjectID)
		assert.NoError(t, err)

		res, err := api.GetMeetingPreparationOverviewResult(view, userID, timezoneOffset)
		assert.NoError(t, err)

		var item database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertResult.InsertedID.(primitive.ObjectID)}).Decode(&item)
		assert.NoError(t, err)
		assert.Equal(t, true, *item.IsCompleted)
		assert.NotEqual(t, primitive.DateTime(0), item.CompletedAt)
		assert.Equal(t, true, item.MeetingPreparationParams.HasBeenAutomaticallyCompleted)
		assert.NotNil(t, res)
		assert.Equal(t, 2, len(res.ViewItems))
		assert.Equal(t, "Event1", res.ViewItems[0].Title)
		assert.Equal(t, "Event2", res.ViewItems[1].Title)
	})
	t.Run("MeetingPrepTaskCompletedAlready", func(t *testing.T) {
		insertResult, err := createTestMeetingPreparationTask(taskCollection, userID, "to the moon", primitive.NewObjectID().Hex(), true, timeZero, timeZero, primitive.NilObjectID)
		assert.NoError(t, err)

		res, err := api.GetMeetingPreparationOverviewResult(view, userID, timezoneOffset)
		assert.NoError(t, err)

		var item database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertResult.InsertedID.(primitive.ObjectID)}).Decode(&item)
		assert.NoError(t, err)
		assert.Equal(t, true, *item.IsCompleted)
		assert.Equal(t, false, item.MeetingPreparationParams.HasBeenAutomaticallyCompleted)
		assert.NotNil(t, res)
		assert.Equal(t, 2, len(res.ViewItems))
		assert.Equal(t, "Event1", res.ViewItems[0].Title)
		assert.Equal(t, "Event2", res.ViewItems[1].Title)
	})
	t.Run("MarkTaskWithMissingEventDone", func(t *testing.T) {
		idExternal := primitive.NewObjectID().Hex()
		insertResult, err := createTestMeetingPreparationTask(taskCollection, userID, "Event3", idExternal, false, timeTwoHoursLater, timeOneDayLater, primitive.NewObjectID())
		assert.NoError(t, err)

		res, err := api.GetMeetingPreparationOverviewResult(view, userID, timezoneOffset)
		assert.NoError(t, err)
		assert.NotNil(t, res)
		// Event3 shouldn't be included in the results
		assert.Equal(t, 2, len(res.ViewItems))
		assert.Equal(t, "Event1", res.ViewItems[0].Title)
		assert.Equal(t, "Event2", res.ViewItems[1].Title)

		var item database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertResult.InsertedID.(primitive.ObjectID)}).Decode(&item)
		assert.NoError(t, err)
		assert.Equal(t, true, *item.IsCompleted)
		assert.NotEqual(t, primitive.DateTime(0), item.CompletedAt)
		assert.Equal(t, true, item.MeetingPreparationParams.HasBeenAutomaticallyCompleted)
	})
}

func createTestEvent(calendarEventCollection *mongo.Collection, userID primitive.ObjectID, title string, idExternal string, dateTimeStart time.Time, dateTimeEnd time.Time, linkedTaskID primitive.ObjectID) (*mongo.InsertOneResult, error) {
	return calendarEventCollection.InsertOne(context.Background(), database.CalendarEvent{
		UserID:        userID,
		Title:         title,
		Body:          "event body",
		IDExternal:    idExternal,
		SourceID:      external.TASK_SOURCE_ID_GCAL,
		DatetimeStart: primitive.NewDateTimeFromTime(dateTimeStart),
		DatetimeEnd:   primitive.NewDateTimeFromTime(dateTimeEnd),
		LinkedTaskID:  linkedTaskID,
	})
}

func createTestMeetingPreparationTask(taskCollection *mongo.Collection, userID primitive.ObjectID, title string, IDExternal string, isCompleted bool, dateTimeStart time.Time, dateTimeEnd time.Time, eventID primitive.ObjectID) (*mongo.InsertOneResult, error) {
	return taskCollection.InsertOne(context.Background(), database.Task{
		UserID:                   userID,
		SourceID:                 external.TASK_SOURCE_ID_GCAL,
		Title:                    &title,
		IsCompleted:              &isCompleted,
		IsMeetingPreparationTask: true,
		MeetingPreparationParams: &database.MeetingPreparationParams{
			CalendarEventID: eventID,
			IDExternal:      IDExternal,
			DatetimeStart:   primitive.NewDateTimeFromTime(dateTimeStart),
			DatetimeEnd:     primitive.NewDateTimeFromTime(dateTimeEnd),
		},
	})
}

func TestGetDueTodayOverviewResult(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userID := primitive.NewObjectID()
	view := database.View{
		UserID:     userID,
		IDOrdering: 1,
		Type:       "due_today",
		IsLinked:   true,
	}
	viewCollection := database.GetViewCollection(api.DB)
	_, err := viewCollection.InsertOne(context.Background(), view)
	assert.NoError(t, err)

	expectedViewResult := OverviewResult[TaskResult]{
		ID:            view.ID,
		Name:          "Due Today",
		Type:          constants.ViewDueToday,
		Logo:          external.TaskServiceGeneralTask.LogoV2,
		IsLinked:      true,
		Sources:       []SourcesResult{},
		IsReorderable: false,
		IDOrdering:    1,
		TaskSectionID: primitive.NilObjectID,
	}

	t.Run("EmptyViewItems", func(t *testing.T) {
		result, err := api.GetDueTodayOverviewResult(view, userID, 0)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		expectedViewResult.ViewItems = []*TaskResult{}
		assertOverviewViewResultEqual(t, expectedViewResult, *result)
	})
	t.Run("SuccessTaskViewItems", func(t *testing.T) {
		taskCollection := database.GetTaskCollection(api.DB)
		notCompleted := false
		completed := true
		deleted := true

		before, err := time.Parse("2006-01-02", "2000-01-01")
		assert.NoError(t, err)
		primitiveBefore := primitive.NewDateTimeFromTime(before)

		beforeButLater, err := time.Parse("2006-01-02", "2000-02-01")
		assert.NoError(t, err)
		primitiveBeforeButLater := primitive.NewDateTimeFromTime(beforeButLater)

		after, err := time.Parse("2006-01-02", "2100-01-01")
		assert.NoError(t, err)
		primitiveAfter := primitive.NewDateTimeFromTime(after)

		primitiveEmptyDateTime := primitive.NewDateTimeFromTime(time.Time{})
		primitiveZeroDateTime := primitive.NewDateTimeFromTime(time.Unix(0, 0))

		items := []interface{}{
			// due before but later
			database.Task{
				UserID:      userID,
				IsCompleted: &notCompleted,
				SourceID:    external.TASK_SOURCE_ID_GT_TASK,
				DueDate:     &primitiveBeforeButLater,
				IDOrdering:  0,
			},
			// not completed, due before
			database.Task{
				UserID:      userID,
				IsCompleted: &notCompleted,
				SourceID:    external.TASK_SOURCE_ID_GT_TASK,
				DueDate:     &primitiveBefore,
				IDOrdering:  1,
			},
			// linear source, due before
			database.Task{
				UserID:      userID,
				IsCompleted: &notCompleted,
				SourceID:    external.TASK_SOURCE_ID_LINEAR,
				DueDate:     &primitiveBefore,
				IDOrdering:  2,
			},
			// not completed, no due date
			database.Task{
				UserID:      userID,
				IsCompleted: &notCompleted,
				SourceID:    external.TASK_SOURCE_ID_GT_TASK,
				IDOrdering:  3,
			},
			// completed, due before
			database.Task{
				UserID:      userID,
				IsCompleted: &completed,
				SourceID:    external.TASK_SOURCE_ID_GT_TASK,
				DueDate:     &primitiveBefore,
				IDOrdering:  4,
			},
			// not completed, due after
			database.Task{
				UserID:      userID,
				IsCompleted: &notCompleted,
				SourceID:    external.TASK_SOURCE_ID_GT_TASK,
				DueDate:     &primitiveAfter,
				IDOrdering:  5,
			},
			// wrong user ID, due before
			database.Task{
				UserID:      primitive.NewObjectID(),
				IsCompleted: &notCompleted,
				SourceID:    external.TASK_SOURCE_ID_GT_TASK,
				DueDate:     &primitiveBefore,
				IDOrdering:  6,
			},
			// subtask, due before
			database.Task{
				UserID:       userID,
				IsCompleted:  &notCompleted,
				SourceID:     external.TASK_SOURCE_ID_GT_TASK,
				DueDate:      &primitiveBefore,
				ParentTaskID: primitive.NewObjectID(),
				IDOrdering:   7,
			},
			// empty date time
			database.Task{
				UserID:      userID,
				IsCompleted: &notCompleted,
				SourceID:    external.TASK_SOURCE_ID_GT_TASK,
				DueDate:     &primitiveEmptyDateTime,
				IDOrdering:  8,
			},
			// zero date time
			database.Task{
				UserID:      userID,
				IsCompleted: &notCompleted,
				SourceID:    external.TASK_SOURCE_ID_GT_TASK,
				DueDate:     &primitiveZeroDateTime,
				IDOrdering:  9,
			},
			// deleted
			database.Task{
				UserID:      userID,
				IsCompleted: &notCompleted,
				IsDeleted:   &deleted,
				SourceID:    external.TASK_SOURCE_ID_GT_TASK,
				DueDate:     &primitiveBefore,
				IDOrdering:  10,
			},
		}
		taskResult, err := taskCollection.InsertMany(context.Background(), items)
		assert.NoError(t, err)
		assert.Equal(t, 11, len(taskResult.InsertedIDs))
		firstTaskID := taskResult.InsertedIDs[0].(primitive.ObjectID)
		secondTaskID := taskResult.InsertedIDs[1].(primitive.ObjectID)
		thirdTaskID := taskResult.InsertedIDs[2].(primitive.ObjectID)

		result, err := api.GetDueTodayOverviewResult(view, userID, 0)
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
		result, err := api.GetDueTodayOverviewResult(view, primitive.NewObjectID(), 0)
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
		assert.Nil(t, result)
	})
}

func testReorderTaskResultsByDueDate(t *testing.T) {
	t.Run("EmptyResults", func(t *testing.T) {
		tasks := []*TaskResult{}
		result := reorderTaskResultsByDueDate(tasks)
		assert.Equal(t, 0, len(result))
	})
	t.Run("Success", func(t *testing.T) {
		tasks := []*TaskResult{
			{
				DueDate:    "2000-01-01",
				IDOrdering: 0,
			},
			{
				DueDate:    "2000-02-01",
				IDOrdering: 1,
			},
			{
				DueDate:    "2000-01-01",
				IDOrdering: 2,
			},
		}
		result := reorderTaskResultsByDueDate(tasks)
		assert.Equal(t, 3, len(result))
		assert.Equal(t, "2000-01-01", result[0].DueDate)
		assert.Equal(t, "2000-02-01", result[2].DueDate)
	})
}

func TestUpdateViewsLinkedStatus(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	userID := primitive.NewObjectID()
	externalAPITokenCollection := database.GetExternalTokenCollection(api.DB)

	t.Run("InvalidUserID", func(t *testing.T) {
		views := []database.View{
			{
				UserID: userID,
			},
		}
		err := api.UpdateViewsLinkedStatus(&views, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
	})
	t.Run("NoViews", func(t *testing.T) {
		views := []database.View{}
		err := api.UpdateViewsLinkedStatus(&views, primitive.NewObjectID())
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
		err := api.UpdateViewsLinkedStatus(&views, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(views))
		assert.False(t, views[0].IsLinked)
	})
	t.Run("UpdateSingleGTView", func(t *testing.T) {
		views := []database.View{
			{
				UserID:   userID,
				IsLinked: false,
				Type:     "task_section",
			},
		}
		err := api.UpdateViewsLinkedStatus(&views, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(views))
		assert.True(t, views[0].IsLinked)
	})
	t.Run("UpdateSingleUnlinkedView", func(t *testing.T) {
		views := []database.View{
			{
				UserID:   userID,
				IsLinked: false,
				Type:     "linear",
			},
		}
		externalAPITokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: external.TaskServiceLinear.ID,
		})

		err := api.UpdateViewsLinkedStatus(&views, userID)
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
		externalAPITokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: external.TaskServiceLinear.ID,
		})

		err := api.UpdateViewsLinkedStatus(&views, userID)
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

		err := api.UpdateViewsLinkedStatus(&views, userID)
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
		err := api.UpdateViewsLinkedStatus(&views, primitive.NewObjectID())
		assert.Error(t, err)
		assert.Equal(t, "invalid user", err.Error())
	})
}

func TestIsServiceLinked(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userID := primitive.NewObjectID()
	testServiceID := "testID"
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	externalAPITokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
		UserID:    userID,
		ServiceID: testServiceID,
	})

	t.Run("ServiceLinked", func(t *testing.T) {
		result, err := api.IsServiceLinked(db, userID, testServiceID)
		assert.NoError(t, err)
		assert.True(t, result)
	})
	t.Run("InvalidUserID", func(t *testing.T) {
		result, err := api.IsServiceLinked(db, primitive.NewObjectID(), testServiceID)
		assert.NoError(t, err)
		assert.False(t, result)
	})
	t.Run("InvalidServiceID", func(t *testing.T) {
		result, err := api.IsServiceLinked(db, userID, "invalidServiceID")
		assert.NoError(t, err)
		assert.False(t, result)
	})
	t.Run("TaskServiceIsTrue", func(t *testing.T) {
		result, err := api.IsServiceLinked(db, userID, external.TASK_SERVICE_ID_GT)
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

	// Remove starter views
	viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})

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
	result, err := viewCollection.InsertMany(context.Background(), insertViews)
	assert.NoError(t, err)
	assert.Equal(t, 4, len(result.InsertedIDs))

	firstViewID := result.InsertedIDs[0].(primitive.ObjectID)
	secondViewID := result.InsertedIDs[1].(primitive.ObjectID)
	thirdViewID := result.InsertedIDs[2].(primitive.ObjectID)
	fourthViewID := result.InsertedIDs[3].(primitive.ObjectID)

	t.Run("MissingIDOrdering", func(t *testing.T) {
		url := fmt.Sprintf("/overview/views/%s/", firstViewID.Hex())
		ServeRequest(t, authToken, "PATCH", url, nil, http.StatusBadRequest, nil)
		checkViewPosition(t, viewCollection, firstViewID, 1)
		checkViewPosition(t, viewCollection, secondViewID, 2)
		checkViewPosition(t, viewCollection, thirdViewID, 3)
		checkViewPosition(t, viewCollection, fourthViewID, 1)
	})
	t.Run("InvalidViewID", func(t *testing.T) {
		ServeRequest(t, authToken, "PATCH", "/overview/views/1/", bytes.NewBuffer([]byte(`{"id_ordering": 1}`)), http.StatusNotFound, nil)
		checkViewPosition(t, viewCollection, firstViewID, 1)
		checkViewPosition(t, viewCollection, secondViewID, 2)
		checkViewPosition(t, viewCollection, thirdViewID, 3)
		checkViewPosition(t, viewCollection, fourthViewID, 1)
	})
	t.Run("IncorrectViewID", func(t *testing.T) {
		viewID := primitive.NewObjectID()
		url := fmt.Sprintf("/overview/views/%s/", viewID.Hex())
		ServeRequest(t, authToken, "PATCH", url, bytes.NewBuffer([]byte(`{"id_ordering": 1}`)), http.StatusNotFound, nil)
		checkViewPosition(t, viewCollection, firstViewID, 1)
		checkViewPosition(t, viewCollection, secondViewID, 2)
		checkViewPosition(t, viewCollection, thirdViewID, 3)
		checkViewPosition(t, viewCollection, fourthViewID, 1)
	})
	t.Run("SuccessInsertFirst", func(t *testing.T) {
		// Expected Result: [3, 1, 2]
		url := fmt.Sprintf("/overview/views/%s/", thirdViewID.Hex())
		ServeRequest(t, authToken, "PATCH", url, bytes.NewBuffer([]byte(`{"id_ordering": 1}`)), http.StatusOK, nil)
		checkViewPosition(t, viewCollection, firstViewID, 2)
		checkViewPosition(t, viewCollection, secondViewID, 3)
		checkViewPosition(t, viewCollection, thirdViewID, 1)
		checkViewPosition(t, viewCollection, fourthViewID, 1)
	})
	t.Run("SuccessInsertSecond", func(t *testing.T) {
		// Expected Result: [1, 3, 2]
		url := fmt.Sprintf("/overview/views/%s/", thirdViewID.Hex())
		ServeRequest(t, authToken, "PATCH", url, bytes.NewBuffer([]byte(`{"id_ordering": 3}`)), http.StatusOK, nil)
		checkViewPosition(t, viewCollection, firstViewID, 1)
		checkViewPosition(t, viewCollection, secondViewID, 3)
		checkViewPosition(t, viewCollection, thirdViewID, 2)
		checkViewPosition(t, viewCollection, fourthViewID, 1)
	})
	t.Run("SuccessInsertThird", func(t *testing.T) {
		// Expected Result: [1, 2, 3]
		url := fmt.Sprintf("/overview/views/%s/", thirdViewID.Hex())
		ServeRequest(t, authToken, "PATCH", url, bytes.NewBuffer([]byte(`{"id_ordering": 4}`)), http.StatusOK, nil)
		checkViewPosition(t, viewCollection, firstViewID, 1)
		checkViewPosition(t, viewCollection, secondViewID, 2)
		checkViewPosition(t, viewCollection, thirdViewID, 3)
		checkViewPosition(t, viewCollection, fourthViewID, 1)
	})
}

func TestOverviewAdd(t *testing.T) {
	authToken := login("testAddView@generaltask.com", "")

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID := getUserIDFromAuthToken(t, db, authToken)

	viewCollection := database.GetViewCollection(db)

	taskSectionCollection := database.GetTaskSectionCollection(db)

	taskSection1, err := taskSectionCollection.InsertOne(context.Background(), database.TaskSection{
		UserID: userID,
		Name:   "Duck section",
	})
	assert.NoError(t, err)
	taskSection1ID := taskSection1.InsertedID.(primitive.ObjectID).Hex()
	otherUserId := primitive.NewObjectID()
	taskSection2, err := taskSectionCollection.InsertOne(context.Background(), database.TaskSection{
		UserID: otherUserId,
		Name:   "Goose section",
	})
	assert.NoError(t, err)
	taskSection2ID := taskSection2.InsertedID.(primitive.ObjectID).Hex()

	t.Run("MissingAllParams", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(``)), http.StatusBadRequest, nil)
		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("MissingType", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(fmt.Sprintf(`{"task_section_id": "%s"}`, taskSection1ID))), http.StatusBadRequest, nil)
		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("InvalidType", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "invalid_type"}`)), http.StatusInternalServerError, nil)
		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("MissingTaskSectionId", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "task_section"}`)), http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"'task_section_id' is required for task section type views\"}", string(body))

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("BadTaskSectionId", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "task_section", "task_section_id": "bruh"}`)), http.StatusInternalServerError, nil)
		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("AddDuplicateView", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		var addedView database.View

		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(fmt.Sprintf(`{"type": "`+string(constants.ViewTaskSection)+`", "task_section_id": "%s"}`, taskSection1ID))), http.StatusOK, nil)
		taskSection1ObjectID, err := primitive.ObjectIDFromHex(taskSection1ID)
		assert.NoError(t, err)
		err = viewCollection.FindOne(context.Background(), bson.M{"user_id": userID, "task_section_id": taskSection1ObjectID}).Decode(&addedView)
		assert.NoError(t, err)
		assert.Equal(t, fmt.Sprintf(`{"id":"%s"}`, addedView.ID.Hex()), string(body))
		assert.Equal(t, database.View{
			ID:            addedView.ID,
			UserID:        userID,
			IDOrdering:    1,
			Type:          string(constants.ViewTaskSection),
			IsLinked:      true,
			TaskSectionID: taskSection1ObjectID,
			GithubID:      "",
		}, addedView)

		ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(fmt.Sprintf(`{"type": "task_section", "task_section_id": "%s"}`, taskSection1ID))), http.StatusBadRequest, nil)

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("AddTaskSectionFromOtherUser", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(fmt.Sprintf(`{"type": "task_section", "task_section_id": "%s"}`, taskSection2ID))), http.StatusBadRequest, nil)

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("AddTaskSectionSuccess", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		var addedView database.View

		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(fmt.Sprintf(`{"type": "`+string(constants.ViewTaskSection)+`", "task_section_id": "%s"}`, taskSection1ID))), http.StatusOK, nil)
		taskSection1ObjectID, err := primitive.ObjectIDFromHex(taskSection1ID)
		assert.NoError(t, err)
		err = viewCollection.FindOne(context.Background(), bson.M{"user_id": userID, "task_section_id": taskSection1ObjectID}).Decode(&addedView)
		assert.NoError(t, err)
		assert.Equal(t, fmt.Sprintf(`{"id":"%s"}`, addedView.ID.Hex()), string(body))
		assert.Equal(t, database.View{
			ID:            addedView.ID,
			UserID:        userID,
			IDOrdering:    1,
			Type:          string(constants.ViewTaskSection),
			IsLinked:      true,
			TaskSectionID: taskSection1ObjectID,
			GithubID:      "",
		}, addedView)

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("AddLinearViewSuccess", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		var addedView database.View
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "`+string(constants.ViewLinear)+`"}`)), http.StatusOK, nil)
		err = viewCollection.FindOne(context.Background(), bson.M{"user_id": userID, "type": string(constants.ViewLinear)}).Decode(&addedView)
		assert.NoError(t, err)
		assert.Equal(t, fmt.Sprintf(`{"id":"%s"}`, addedView.ID.Hex()), string(body))
		assert.Equal(t, database.View{
			ID:            addedView.ID,
			UserID:        userID,
			IDOrdering:    1,
			Type:          string(constants.ViewLinear),
			IsLinked:      false,
			TaskSectionID: primitive.NilObjectID,
			GithubID:      "",
		}, addedView)

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("AddSlackViewSuccess", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		var addedView database.View
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "`+string(constants.ViewSlack)+`"}`)), http.StatusOK, nil)
		err = viewCollection.FindOne(context.Background(), bson.M{"user_id": userID, "type": string(constants.ViewSlack)}).Decode(&addedView)
		assert.NoError(t, err)
		assert.Equal(t, fmt.Sprintf(`{"id":"%s"}`, addedView.ID.Hex()), string(body))
		assert.Equal(t, database.View{
			ID:            addedView.ID,
			UserID:        userID,
			IDOrdering:    1,
			Type:          string(constants.ViewSlack),
			IsLinked:      false,
			TaskSectionID: primitive.NilObjectID,
			GithubID:      "",
		}, addedView)

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("AddGithubViewMissingGithubID", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "github"}`)), http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"'id_github' is required for github type views\"}", string(body))

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("AddGithubViewMalformattedGithubID", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "github", "github_id": 123}`)), http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"invalid or missing parameter\"}", string(body))

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("AddGithubViewInvalidGithubID", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(`{"type": "github", "github_id": "foobar"}`)), http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"invalid 'id_github'\"}", string(body))

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("IncorrectUserID", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		// Create pull request with incorrect user ID
		_, err := createTestPullRequest(db, primitive.NewObjectID(), "amc-to-the-moon", false, true, "", time.Now(), "")
		assert.NoError(t, err)
		repositoryCollection := database.GetRepositoryCollection(db)
		repositoryID := primitive.NewObjectID().Hex()
		_, err = repositoryCollection.InsertOne(context.Background(), &database.Repository{
			UserID:       primitive.NewObjectID(),
			RepositoryID: repositoryID,
		})
		assert.NoError(t, err)
		ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(fmt.Sprintf(`{"type": "`+string(constants.ViewGithub)+`", "github_id": "%s"}`, repositoryID))), http.StatusBadRequest, nil)

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID, "type": string(constants.ViewGithub)})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("AddGithubViewSuccess", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		_, err := createTestPullRequest(db, userID, "amc-to-the-moon", false, true, "", time.Now(), "")
		assert.NoError(t, err)
		repositoryCollection := database.GetRepositoryCollection(db)
		repositoryID := primitive.NewObjectID().Hex()
		_, err = repositoryCollection.InsertOne(context.Background(), &database.Repository{
			UserID:       userID,
			RepositoryID: repositoryID,
		})
		assert.NoError(t, err)
		body := ServeRequest(t, authToken, "POST", "/overview/views/", bytes.NewBuffer([]byte(fmt.Sprintf(`{"type": "`+string(constants.ViewGithub)+`", "github_id": "%s"}`, repositoryID))), http.StatusOK, nil)
		var addedView database.View
		err = viewCollection.FindOne(context.Background(), bson.M{"user_id": userID, "type": string(constants.ViewGithub)}).Decode(&addedView)
		assert.NoError(t, err)
		assert.Equal(t, fmt.Sprintf(`{"id":"%s"}`, addedView.ID.Hex()), string(body))

		assert.Equal(t, database.View{
			ID:            addedView.ID,
			UserID:        userID,
			IDOrdering:    1,
			Type:          string(constants.ViewGithub),
			IsLinked:      false,
			TaskSectionID: primitive.NilObjectID,
			GithubID:      repositoryID,
		}, addedView)

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
}

func TestOverviewViewDelete(t *testing.T) {
	authToken := login("testDeleteView@generaltask.com", "")

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	viewCollection := database.GetViewCollection(db)
	userID := getUserIDFromAuthToken(t, db, authToken)
	view, err := viewCollection.InsertOne(context.Background(), database.View{
		UserID: userID,
	})
	assert.NoError(t, err)
	viewID := view.InsertedID.(primitive.ObjectID)

	t.Run("InvalidViewID", func(t *testing.T) {
		ServeRequest(t, authToken, "DELETE", "/overview/views/1/", nil, http.StatusNotFound, nil)
		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"_id": viewID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("IncorrectViewID", func(t *testing.T) {
		incorrectViewID := primitive.NewObjectID()
		url := fmt.Sprintf("/overview/views/%s/", incorrectViewID.Hex())
		ServeRequest(t, authToken, "DELETE", url, nil, http.StatusNotFound, nil)

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"_id": viewID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("InvalidUserID", func(t *testing.T) {
		url := fmt.Sprintf("/overview/views/%s/", viewID.Hex())
		authToken := "invalidAuthToken"
		ServeRequest(t, authToken, "DELETE", url, nil, http.StatusUnauthorized, nil)

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"_id": viewID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("Success", func(t *testing.T) {
		url := fmt.Sprintf("/overview/views/%s/", viewID.Hex())
		ServeRequest(t, authToken, "DELETE", url, nil, http.StatusOK, nil)

		count, err := viewCollection.CountDocuments(context.Background(), bson.M{"_id": viewID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
}

func TestOverviewSupportedViewsList(t *testing.T) {
	authToken := login("TestOverviewSupportedViewsList@generaltask.com", "")

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID := getUserIDFromAuthToken(t, db, authToken)
	viewCollection := database.GetViewCollection(db)
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	taskSectionCollection := database.GetTaskSectionCollection(db)
	taskSection, err := taskSectionCollection.InsertOne(context.Background(), database.TaskSection{
		UserID: userID,
		Name:   "Duck section",
	})
	assert.NoError(t, err)
	taskSectionObjectID := taskSection.InsertedID.(primitive.ObjectID)
	taskSectionID := taskSectionObjectID.Hex()

	UnauthorizedTest(t, "GET", "/overview/supported_views/", nil)
	t.Run("TestNoViewsAdded", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		externalAPITokenCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		body := ServeRequest(t, authToken, "GET", "/overview/supported_views/", nil, http.StatusOK, nil)

		expectedBody := fmt.Sprintf("[{\"type\":\"meeting_preparation\",\"name\":\"Meeting Preparation for the day\",\"logo\":\"gcal\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Meeting Preparation\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"due_today\",\"name\":\"Tasks Due Today\",\"logo\":\"generaltask\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Tasks Due Today View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"task_section\",\"name\":\"Task Folders\",\"logo\":\"generaltask\",\"is_nested\":true,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Task Inbox\",\"is_added\":false,\"task_section_id\":\"000000000000000000000001\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"},{\"name\":\"Duck section\",\"is_added\":false,\"task_section_id\":\"%s\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"linear\",\"name\":\"Linear\",\"logo\":\"linear\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/linear/\",\"views\":[{\"name\":\"Linear View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"slack\",\"name\":\"Slack\",\"logo\":\"slack\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/slack/\",\"views\":[{\"name\":\"Slack View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"github\",\"name\":\"GitHub\",\"logo\":\"github\",\"is_nested\":true,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/github/\",\"views\":[]}]", taskSectionID)
		assert.Equal(t, expectedBody, string(body))
	})
	t.Run("TestTaskSectionIsAdded", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		externalAPITokenCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		view, err := viewCollection.InsertOne(context.Background(), database.View{
			UserID:        userID,
			Type:          "task_section",
			IsLinked:      false,
			TaskSectionID: taskSectionObjectID,
		})
		assert.NoError(t, err)
		addedViewId := view.InsertedID.(primitive.ObjectID).Hex()
		body := ServeRequest(t, authToken, "GET", "/overview/supported_views/", nil, http.StatusOK, nil)
		expectedBody := fmt.Sprintf("[{\"type\":\"meeting_preparation\",\"name\":\"Meeting Preparation for the day\",\"logo\":\"gcal\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Meeting Preparation\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"due_today\",\"name\":\"Tasks Due Today\",\"logo\":\"generaltask\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Tasks Due Today View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"task_section\",\"name\":\"Task Folders\",\"logo\":\"generaltask\",\"is_nested\":true,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Task Inbox\",\"is_added\":false,\"task_section_id\":\"000000000000000000000001\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"},{\"name\":\"Duck section\",\"is_added\":true,\"task_section_id\":\"%s\",\"github_id\":\"\",\"view_id\":\"%s\"}]},{\"type\":\"linear\",\"name\":\"Linear\",\"logo\":\"linear\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/linear/\",\"views\":[{\"name\":\"Linear View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"slack\",\"name\":\"Slack\",\"logo\":\"slack\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/slack/\",\"views\":[{\"name\":\"Slack View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"github\",\"name\":\"GitHub\",\"logo\":\"github\",\"is_nested\":true,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/github/\",\"views\":[]}]", taskSectionID, addedViewId)
		assert.Equal(t, expectedBody, string(body))
	})
	t.Run("TestLinearIsAddedIsUnlinked", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		externalAPITokenCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		view, err := viewCollection.InsertOne(context.Background(), database.View{
			UserID:   userID,
			Type:     "linear",
			IsLinked: false,
		})
		assert.NoError(t, err)
		addedViewId := view.InsertedID.(primitive.ObjectID).Hex()
		body := ServeRequest(t, authToken, "GET", "/overview/supported_views/", nil, http.StatusOK, nil)
		expectedBody := fmt.Sprintf("[{\"type\":\"meeting_preparation\",\"name\":\"Meeting Preparation for the day\",\"logo\":\"gcal\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Meeting Preparation\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"due_today\",\"name\":\"Tasks Due Today\",\"logo\":\"generaltask\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Tasks Due Today View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"task_section\",\"name\":\"Task Folders\",\"logo\":\"generaltask\",\"is_nested\":true,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Task Inbox\",\"is_added\":false,\"task_section_id\":\"000000000000000000000001\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"},{\"name\":\"Duck section\",\"is_added\":false,\"task_section_id\":\"%s\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"linear\",\"name\":\"Linear\",\"logo\":\"linear\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/linear/\",\"views\":[{\"name\":\"Linear View\",\"is_added\":true,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"%s\"}]},{\"type\":\"slack\",\"name\":\"Slack\",\"logo\":\"slack\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/slack/\",\"views\":[{\"name\":\"Slack View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"github\",\"name\":\"GitHub\",\"logo\":\"github\",\"is_nested\":true,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/github/\",\"views\":[]}]", taskSectionID, addedViewId)
		assert.Equal(t, expectedBody, string(body))
	})
	t.Run("TestLinearIsAddedIsLinked", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		externalAPITokenCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		view, err := viewCollection.InsertOne(context.Background(), database.View{
			UserID:   userID,
			Type:     "linear",
			IsLinked: true,
		})
		assert.NoError(t, err)
		addedViewId := view.InsertedID.(primitive.ObjectID).Hex()
		externalAPITokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
			UserID:    userID,
			Token:     "testtoken",
			ServiceID: external.TASK_SERVICE_ID_LINEAR,
		})
		body := ServeRequest(t, authToken, "GET", "/overview/supported_views/", nil, http.StatusOK, nil)
		expectedBody := fmt.Sprintf("[{\"type\":\"meeting_preparation\",\"name\":\"Meeting Preparation for the day\",\"logo\":\"gcal\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Meeting Preparation\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"due_today\",\"name\":\"Tasks Due Today\",\"logo\":\"generaltask\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Tasks Due Today View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"task_section\",\"name\":\"Task Folders\",\"logo\":\"generaltask\",\"is_nested\":true,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Task Inbox\",\"is_added\":false,\"task_section_id\":\"000000000000000000000001\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"},{\"name\":\"Duck section\",\"is_added\":false,\"task_section_id\":\"%s\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"linear\",\"name\":\"Linear\",\"logo\":\"linear\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Linear View\",\"is_added\":true,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"%s\"}]},{\"type\":\"slack\",\"name\":\"Slack\",\"logo\":\"slack\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/slack/\",\"views\":[{\"name\":\"Slack View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"github\",\"name\":\"GitHub\",\"logo\":\"github\",\"is_nested\":true,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/github/\",\"views\":[]}]", taskSectionID, addedViewId)
		assert.Equal(t, expectedBody, string(body))
	})
	t.Run("TestSlackIsAddedIsUnlinked", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		externalAPITokenCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		view, err := viewCollection.InsertOne(context.Background(), database.View{
			UserID:   userID,
			Type:     "slack",
			IsLinked: false,
		})
		assert.NoError(t, err)
		addedViewId := view.InsertedID.(primitive.ObjectID).Hex()
		body := ServeRequest(t, authToken, "GET", "/overview/supported_views/", nil, http.StatusOK, nil)
		expectedBody := fmt.Sprintf("[{\"type\":\"meeting_preparation\",\"name\":\"Meeting Preparation for the day\",\"logo\":\"gcal\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Meeting Preparation\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"due_today\",\"name\":\"Tasks Due Today\",\"logo\":\"generaltask\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Tasks Due Today View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"task_section\",\"name\":\"Task Folders\",\"logo\":\"generaltask\",\"is_nested\":true,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Task Inbox\",\"is_added\":false,\"task_section_id\":\"000000000000000000000001\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"},{\"name\":\"Duck section\",\"is_added\":false,\"task_section_id\":\"%s\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"linear\",\"name\":\"Linear\",\"logo\":\"linear\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/linear/\",\"views\":[{\"name\":\"Linear View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"slack\",\"name\":\"Slack\",\"logo\":\"slack\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/slack/\",\"views\":[{\"name\":\"Slack View\",\"is_added\":true,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"%s\"}]},{\"type\":\"github\",\"name\":\"GitHub\",\"logo\":\"github\",\"is_nested\":true,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/github/\",\"views\":[]}]", taskSectionID, addedViewId)
		assert.Equal(t, expectedBody, string(body))
	})
	t.Run("TestSlackIsAddedIsLinked", func(t *testing.T) {
		viewCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		externalAPITokenCollection.DeleteMany(context.Background(), bson.M{"user_id": userID})
		view, err := viewCollection.InsertOne(context.Background(), database.View{
			UserID:   userID,
			Type:     "slack",
			IsLinked: false,
		})
		assert.NoError(t, err)
		addedViewId := view.InsertedID.(primitive.ObjectID).Hex()
		externalAPITokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
			UserID:    userID,
			Token:     "testtoken",
			ServiceID: external.TASK_SERVICE_ID_SLACK,
		})
		body := ServeRequest(t, authToken, "GET", "/overview/supported_views/", nil, http.StatusOK, nil)
		expectedBody := fmt.Sprintf("[{\"type\":\"meeting_preparation\",\"name\":\"Meeting Preparation for the day\",\"logo\":\"gcal\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Meeting Preparation\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"due_today\",\"name\":\"Tasks Due Today\",\"logo\":\"generaltask\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Tasks Due Today View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"task_section\",\"name\":\"Task Folders\",\"logo\":\"generaltask\",\"is_nested\":true,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Task Inbox\",\"is_added\":false,\"task_section_id\":\"000000000000000000000001\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"},{\"name\":\"Duck section\",\"is_added\":false,\"task_section_id\":\"%s\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"linear\",\"name\":\"Linear\",\"logo\":\"linear\",\"is_nested\":false,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/linear/\",\"views\":[{\"name\":\"Linear View\",\"is_added\":false,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"000000000000000000000000\"}]},{\"type\":\"slack\",\"name\":\"Slack\",\"logo\":\"slack\",\"is_nested\":false,\"is_linked\":true,\"authorization_url\":\"\",\"views\":[{\"name\":\"Slack View\",\"is_added\":true,\"task_section_id\":\"000000000000000000000000\",\"github_id\":\"\",\"view_id\":\"%s\"}]},{\"type\":\"github\",\"name\":\"GitHub\",\"logo\":\"github\",\"is_nested\":true,\"is_linked\":false,\"authorization_url\":\"http://localhost:8080/link/github/\",\"views\":[]}]", taskSectionID, addedViewId)
		assert.Equal(t, expectedBody, string(body))
	})
}

func TestIsValidGithubRepository(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	repositoryCollection := database.GetRepositoryCollection(db)

	userID := primitive.NewObjectID()
	repositoryID := primitive.NewObjectID().Hex()
	repositoryCollection.InsertOne(context.Background(), database.Repository{
		UserID:       userID,
		RepositoryID: repositoryID,
	})
	t.Run("Success", func(t *testing.T) {
		result, err := isValidGithubRepository(db, userID, repositoryID)
		assert.NoError(t, err)
		assert.True(t, result)
	})
	t.Run("InvalidUserID", func(t *testing.T) {
		result, err := isValidGithubRepository(db, primitive.NewObjectID(), repositoryID)
		assert.NoError(t, err)
		assert.False(t, result)
	})
	t.Run("InvalidRepositoryID", func(t *testing.T) {
		result, err := isValidGithubRepository(db, userID, primitive.NewObjectID().Hex())
		assert.NoError(t, err)
		assert.False(t, result)
	})
	t.Run("InvalidUserAndRepositoryID", func(t *testing.T) {
		result, err := isValidGithubRepository(db, primitive.NewObjectID(), primitive.NewObjectID().Hex())
		assert.NoError(t, err)
		assert.False(t, result)
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
	err := viewCollection.FindOne(context.Background(), bson.M{"_id": viewID}).Decode(&view)
	assert.NoError(t, err)
	assert.Equal(t, position, view.IDOrdering)
}
