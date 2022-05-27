package external

import (
	"context"
	"net/http"
	"testing"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"

	"github.com/stretchr/testify/assert"
)

const (
	SavedMessagesResponse string = `{
		"ok": true,
		"items": [
			{
				"type": "message",
				"channel": "D02591G1X6J",
				"message": {
					"client_msg_id": "a4f0672f-618c-411f-9f21-a2f926af2423",
					"type": "message",
					"text": "don't forget to drink your ovaltine!",
					"user": "U025FVDFA91",
					"ts": "1648583693.380569",
					"team": "T01ML9H5LJD",
					"attachments": [],
					"blocks": [],
					"is_starred": true,
					"permalink": "https://generaltask.slack.com/archives/D02591G1X6J/p1648583693380569"
				},
				"date_create": 1648585143
			}
		],
		"response_metadata": {
			"next_cursor": ""
		}
	}`
	SavedMessageIDExternal string = "a4f0672f-618c-411f-9f21-a2f926af2423"
)

func TestLoadSlackTasks(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	savedMessagesServerSuccess := testutils.GetMockAPIServer(t, http.StatusOK, SavedMessagesResponse)
	savedMessagesSuccessURL := savedMessagesServerSuccess.URL + "/"

	t.Run("BadSlackStatusCode", func(t *testing.T) {
		savedMessagesServer := testutils.GetMockAPIServer(t, http.StatusInternalServerError, "")
		defer savedMessagesServer.Close()
		savedMessagesURL := savedMessagesServer.URL + "/"
		slackSaved := SlackSavedTaskSource{Slack: SlackService{Config: SlackConfig{ConfigValues: SlackConfigValues{SavedMessagesURL: &savedMessagesURL}}}}
		userID := primitive.NewObjectID()

		var taskResult = make(chan TaskResult)
		go slackSaved.GetTasks(userID, "hood_stock@down_bad.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, "slack server error: 500 Internal Server Error", result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("BadSlackResponse", func(t *testing.T) {
		savedMessagesServer := testutils.GetMockAPIServer(t, http.StatusOK, "dogecoin to the moon")
		defer savedMessagesServer.Close()
		savedMessagesURL := savedMessagesServer.URL + "/"
		slackSaved := SlackSavedTaskSource{Slack: SlackService{Config: SlackConfig{ConfigValues: SlackConfigValues{SavedMessagesURL: &savedMessagesURL}}}}
		userID := primitive.NewObjectID()

		var taskResult = make(chan TaskResult)
		go slackSaved.GetTasks(userID, "tsla_stock@down_bad.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, "invalid character 'd' looking for beginning of value", result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("Success", func(t *testing.T) {
		slackSaved := SlackSavedTaskSource{Slack: SlackService{Config: SlackConfig{ConfigValues: SlackConfigValues{SavedMessagesURL: &savedMessagesSuccessURL}}}}
		userID := primitive.NewObjectID()

		expectedTask := database.Item{
			TaskBase: database.TaskBase{
				IDOrdering:    0,
				IDExternal:    SavedMessageIDExternal,
				IDTaskSection: constants.IDTaskSectionDefault,
				Title:         "don't forget to drink your ovaltine!",
				SourceID:      TASK_SOURCE_ID_SLACK_SAVED,
				UserID:        userID,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		}

		var taskResult = make(chan TaskResult)
		go slackSaved.GetTasks(userID, "dogecoin@down_bad.com", taskResult)
		result := <-taskResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.Tasks))
		assertTasksEqual(t, &expectedTask, result.Tasks[0])

		var taskFromDB database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err := taskCollection.FindOne(
			dbCtx,
			bson.M{"user_id": userID},
		).Decode(&taskFromDB)
		assert.NoError(t, err)
		assertTasksEqual(t, &expectedTask, &taskFromDB)
	})
	t.Run("SuccessExisting", func(t *testing.T) {
		slackSaved := SlackSavedTaskSource{Slack: SlackService{Config: SlackConfig{ConfigValues: SlackConfigValues{SavedMessagesURL: &savedMessagesSuccessURL}}}}
		userID := primitive.NewObjectID()

		expectedTask := database.Item{
			TaskBase: database.TaskBase{
				IDOrdering:      0,
				IDExternal:      SavedMessageIDExternal,
				IDTaskSection:   constants.IDTaskSectionDefault,
				IsCompleted:     true,
				Title:           "don't forget to drink your ovaltine!",
				SourceID:        TASK_SOURCE_ID_SLACK_SAVED,
				SourceAccountID: "bing chilling",
				UserID:          userID,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		}
		database.GetOrCreateItem(
			db,
			userID,
			SavedMessageIDExternal,
			TASK_SOURCE_ID_SLACK_SAVED,
			&expectedTask,
		)

		var taskResult = make(chan TaskResult)
		go slackSaved.GetTasks(userID, "stonks@down_bad.com", taskResult)
		result := <-taskResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.Tasks))
		assertTasksEqual(t, &expectedTask, result.Tasks[0])
		assert.False(t, result.Tasks[0].IsCompleted)

		var taskFromDB database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err := taskCollection.FindOne(
			dbCtx,
			bson.M{"user_id": userID},
		).Decode(&taskFromDB)
		assert.NoError(t, err)
		assertTasksEqual(t, &expectedTask, &taskFromDB)
		assert.False(t, taskFromDB.IsCompleted)
		assert.Equal(t, "bing chilling", taskFromDB.SourceAccountID) // doesn't get updated
	})
}
