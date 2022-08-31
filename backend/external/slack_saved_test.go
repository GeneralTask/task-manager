package external

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/utils"

	"github.com/stretchr/testify/assert"
)

func TestLoadSlackTasks(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	task := createTestSlackTask(userID)
	taskWrongSource := createTestSlackTask(userID)
	taskWrongSource.SourceID = TASK_SOURCE_ID_GCAL
	taskCompleted := createTestSlackTask(userID)
	completed := true
	taskCompleted.IsCompleted = &completed
	insertTestTasks(
		t,
		userID,
		[]*database.Task{
			task,
			taskWrongSource,
			taskCompleted,
		},
	)

	t.Run("Success", func(t *testing.T) {
		var tasks = make(chan TaskResult)
		go SlackSavedTaskSource{}.GetTasks(db, userID, GeneralTaskDefaultAccountID, tasks)
		result := <-tasks
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.Tasks))
		// check IDExternal because ID is set upon db insertion
		assert.Equal(t, task.IDExternal, result.Tasks[0].IDExternal)
	})
	t.Run("WrongUserID", func(t *testing.T) {
		var tasks = make(chan TaskResult)
		go SlackSavedTaskSource{}.GetTasks(db, primitive.NewObjectID(), GeneralTaskDefaultAccountID, tasks)
		result := <-tasks
		assert.NoError(t, result.Error)
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("WrongSourceAccountID", func(t *testing.T) {
		var tasks = make(chan TaskResult)
		go SlackSavedTaskSource{}.GetTasks(db, userID, "other_account_id", tasks)
		result := <-tasks
		assert.NoError(t, result.Error)
		assert.Equal(t, 0, len(result.Tasks))
	})
}

func TestSendConfirmationResponse(t *testing.T) {
	t.Run("MalformedExternalToken", func(t *testing.T) {
		server := getServerForTests()
		defer server.Close()
		err := SendConfirmationResponse(database.ExternalAPIToken{}, server.URL)
		assert.Error(t, err)
	})
	t.Run("Success", func(t *testing.T) {
		externalAPIToken := database.ExternalAPIToken{
			Token: `{"access_token": "example_access_token"}`,
		}
		server := getServerForTests()
		defer server.Close()
		err := SendConfirmationResponse(externalAPIToken, server.URL)
		assert.NoError(t, err)
	})
}

func TestCreateSlackTask(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	testTitle := "send dogecoin to the moon"
	testBody := ""
	completed := false
	testTask := database.Task{
		IDTaskSection:   constants.IDTaskSectionDefault,
		SourceID:        TASK_SOURCE_ID_SLACK_SAVED,
		Title:           &testTitle,
		Body:            &testBody,
		SourceAccountID: GeneralTaskDefaultAccountID,
		IsCompleted:     &completed,
		SlackMessageParams: database.SlackMessageParams{
			Channel: database.SlackChannel{
				ID:   "channel ID",
				Name: "channel name",
			},
			User: database.SlackUser{
				ID:   "user ID",
				Name: "user name",
			},
			Team: database.SlackTeam{
				ID:     "team ID",
				Domain: "team domain",
			},
			Message: database.SlackMessage{
				TimeSent: "test ts",
				Text:     "hello!",
			},
		},
	}
	t.Run("SuccessSlackCreation", func(t *testing.T) {
		userID := primitive.NewObjectID()
		testTask.UserID = userID
		_, err := SlackSavedTaskSource{}.CreateNewTask(db, userID, GeneralTaskDefaultAccountID, TaskCreationObject{
			Title: "send dogecoin to the moon",
			SlackMessageParams: database.SlackMessageParams{
				Channel: database.SlackChannel{
					ID:   "channel ID",
					Name: "channel name",
				},
				User: database.SlackUser{
					ID:   "user ID",
					Name: "user name",
				},
				Team: database.SlackTeam{
					ID:     "team ID",
					Domain: "team domain",
				},
				Message: database.SlackMessage{
					TimeSent: "test ts",
					Text:     "hello!",
				},
			},
		})
		assert.NoError(t, err)
		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		task := (*tasks)[0]
		utils.AssertTasksEqual(t, &task, &testTask)
	})
	t.Run("SuccessSlackCustomSpecifySection", func(t *testing.T) {
		userID := primitive.NewObjectID()
		testTask.UserID = userID
		taskSectionID := primitive.NewObjectID()
		testTask.IDTaskSection = taskSectionID
		_, err := SlackSavedTaskSource{}.CreateNewTask(db, userID, GeneralTaskDefaultAccountID, TaskCreationObject{
			Title: "send dogecoin to the moon",
			SlackMessageParams: database.SlackMessageParams{
				Channel: database.SlackChannel{
					ID:   "channel ID",
					Name: "channel name",
				},
				User: database.SlackUser{
					ID:   "user ID",
					Name: "user name",
				},
				Team: database.SlackTeam{
					ID:     "team ID",
					Domain: "team domain",
				},
				Message: database.SlackMessage{
					TimeSent: "test ts",
					Text:     "hello!",
				},
			},
			IDTaskSection: taskSectionID,
		})
		assert.NoError(t, err)
		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		task := (*tasks)[0]
		utils.AssertTasksEqual(t, &task, &testTask)
	})
}

func createTestSlackTask(userID primitive.ObjectID) *database.Task {
	testTitle := "Sample Taskeroni"
	notCompleted := false
	return &database.Task{
		IDOrdering:      2,
		IDExternal:      primitive.NewObjectID().Hex(),
		IDTaskSection:   constants.IDTaskSectionDefault,
		Title:           &testTitle,
		SourceID:        TASK_SOURCE_ID_SLACK_SAVED,
		UserID:          userID,
		SourceAccountID: GeneralTaskDefaultAccountID,
		IsCompleted:     &notCompleted,
	}
}

func getServerForTests() *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	}))
}
