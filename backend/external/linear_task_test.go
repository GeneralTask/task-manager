package external

import (
	"context"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestLoadLinearTasks(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)
	userID := primitive.NewObjectID()

	taskServerSuccess := testutils.GetMockAPIServer(t, 200, `{
		"data": {
			"issues": {
				"nodes": [
					{
						"id": "test-issue-id-1",
						"title": "test title",
						"description": "test description",
						"url": "https://example.com/",
						"createdAt": "2022-06-06T23:13:24.037Z",
						"assignee": {
							"id": "6942069420",
							"name": "Test User"
						},
						"state": {
							"id": "state-id",
							"name": "Todo"
						},
						"team": {
							"name": "Backend",
							"mergeWorkflowState": {
								"name": "Done",
								"id": "merge-workflow-state-id"
							}
						},
						"comments": {
							"nodes": [
								{
									"body": "test comment body",
									"createdAt": "2019-04-21T00:00:00.000Z",
									"user": {
										"id": "test-commenter-id",
										"name": "Test Commenter",
										"displayName": "test comm",
										"email": "testCommenter@generaltask.com"
									}
								}
							]
						}
					}
				]
			}
		}
	}`)
	userInfoServerSuccess := testutils.GetMockAPIServer(t, 200, `{"data": {
			"viewer": {
				"id": "6942069420",
				"name": "Test User",
				"email": "test@generaltask.com"
			}
		}}`)

	t.Run("BadUserInfoStatusCode", func(t *testing.T) {
		userInfoServer := testutils.GetMockAPIServer(t, 400, "")
		defer userInfoServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL: &userInfoServer.URL,
				},
			},
		}}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, `non-200 OK status code: 400 Bad Request body: ""`, result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("BadUserInfoResponse", func(t *testing.T) {
		userInfoServer := getMockServer(t, 200, `oopsie poopsie`, NoopRequestChecker)
		defer userInfoServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL: &userInfoServer.URL,
				},
			},
		}}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, "invalid character 'o' looking for beginning of value", result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("BadTaskStatusCode", func(t *testing.T) {
		taskServer := getMockServer(t, 409, ``, NoopRequestChecker)
		defer taskServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL:  &userInfoServerSuccess.URL,
					TaskFetchURL: &taskServer.URL,
				},
			},
		}}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, `non-200 OK status code: 409 Conflict body: ""`, result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("BadTaskResponse", func(t *testing.T) {
		taskServer := getMockServer(t, 200, `to the moon`, NoopRequestChecker)
		defer taskServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL:  &userInfoServerSuccess.URL,
					TaskFetchURL: &taskServer.URL,
				},
			},
		}}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, "invalid character 'o' in literal true (expecting 'r')", result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("Success", func(t *testing.T) {
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL:  &userInfoServerSuccess.URL,
					TaskFetchURL: &taskServerSuccess.URL,
				},
			},
		}}

		createdAt, _ := time.Parse("2006-01-02", "2019-04-20")
		commentCreatedAt, _ := time.Parse("2006-01-02", "2019-04-21")
		expectedTask := database.Item{
			TaskBase: database.TaskBase{
				IDOrdering:        0,
				IDExternal:        "test-issue-id-1",
				IDTaskSection:     constants.IDTaskSectionDefault,
				Deeplink:          "https://example.com/",
				Title:             "test title",
				Body:              "test description",
				SourceID:          TASK_SOURCE_ID_LINEAR,
				SourceAccountID:   "wrong",
				UserID:            userID,
				CreatedAtExternal: primitive.NewDateTimeFromTime(createdAt),
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
			Task: database.Task{
				Status: &database.ExternalTaskStatus{
					ExternalID: "state-id",
					State:      "Todo",
				},
				CompletedStatus: &database.ExternalTaskStatus{
					ExternalID: "merge-workflow-state-id",
					State:      "Done",
				},
				Comments: &[]database.Comment{
					{
						Body: "test comment body",
						User: database.ExternalUser{
							ExternalID:  "test-commenter-id",
							Name:        "Test Commenter",
							DisplayName: "test comm",
							Email:       "testCommenter@generaltask.com",
						},
						CreatedAt: primitive.NewDateTimeFromTime(commentCreatedAt),
					},
				},
			},
		}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.Tasks))
		assertTasksEqual(t, &expectedTask, result.Tasks[0])
		assert.Equal(t, expectedTask.Status, result.Tasks[0].Status)
		assert.Equal(t, expectedTask.CompletedStatus, result.Tasks[0].CompletedStatus)
		assert.True(t, (expectedTask.Comments == nil) == (result.Tasks[0].Comments == nil))
		if (expectedTask.Comments != nil) && (result.Tasks[0].Comments != nil) {
			expectedComments := *expectedTask.Comments
			actualComments := *result.Tasks[0].Comments
			assert.Equal(t, len(expectedComments), len(actualComments))
			if len(*expectedTask.Comments) == len(*result.Tasks[0].Comments) {
				assert.Equal(t, expectedComments, actualComments)
			}
		}

		var taskFromDB database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err := taskCollection.FindOne(
			dbCtx,
			bson.M{"user_id": userID},
		).Decode(&taskFromDB)
		assert.NoError(t, err)
		assertTasksEqual(t, &expectedTask, &taskFromDB)
		assert.Equal(t, "sample_account@email.com", taskFromDB.SourceAccountID) // doesn't get updated
	})
	t.Run("SuccessExistingTask", func(t *testing.T) {
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL:  &userInfoServerSuccess.URL,
					TaskFetchURL: &taskServerSuccess.URL,
				},
			},
		}}

		createdAt, _ := time.Parse("2006-01-02", "2019-04-20")
		commentCreatedAt, _ := time.Parse("2006-01-02", "2019-04-21")
		expectedTask := database.Item{
			TaskBase: database.TaskBase{
				IDOrdering:        0,
				IDExternal:        "test-issue-id-1",
				IDTaskSection:     constants.IDTaskSectionDefault,
				IsCompleted:       true,
				Deeplink:          "https://example.com/",
				Title:             "wrong test title",
				Body:              "wrong test description",
				SourceID:          TASK_SOURCE_ID_LINEAR,
				SourceAccountID:   "sample_account@email.com",
				UserID:            userID,
				CreatedAtExternal: primitive.NewDateTimeFromTime(createdAt),
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
			Task: database.Task{
				Status: &database.ExternalTaskStatus{
					ExternalID: "state-id",
					State:      "Todo",
				},
				CompletedStatus: &database.ExternalTaskStatus{
					ExternalID: "merge-workflow-state-id",
					State:      "Done",
				},
				Comments: nil,
			},
		}
		database.GetOrCreateItem(
			db,
			userID,
			"test-issue-id-1",
			TASK_SOURCE_ID_LINEAR,
			&expectedTask,
		)
		// switch a few fields from their existing db value to their expected output value
		expectedTask.Title = "test title"
		expectedTask.TaskBase.Body = "test description"
		expectedTask.Comments = &[]database.Comment{
			{
				Body: "test comment body",
				User: database.ExternalUser{
					ExternalID:  "test-commenter-id",
					Name:        "Test Commenter",
					DisplayName: "test comm",
					Email:       "testCommenter@generaltask.com",
				},
				CreatedAt: primitive.NewDateTimeFromTime(commentCreatedAt),
			},
		}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(userID, "sample_account@email.com", taskResult)
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
		assert.Equal(t, "sample_account@email.com", taskFromDB.SourceAccountID) // doesn't get updated
	})
}
