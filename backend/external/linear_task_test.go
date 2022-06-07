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

const (
//DefaultUserInfoResponse string = `{"data": {"workspaces": [{"gid": "6942069420"}]}}`
)

func TestLoadLinearTasks(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	taskServerSuccess := testutils.GetMockAPIServer(t, 200, `{
		"data": {
			"issues": {
				"nodes": [
					{
						"id": "test-issue-id-1",
						"title": "test title",
						"description": "test description",
						"dueDate": "2021-04-20",
						"url": "https://example.com/",
						"createdAt": "2022-06-06T23:13:24.037Z",
						"assignee": {
							"id": "6942069420",
							"name": "Test User"
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

	//t.Run("BadUserInfoStatusCode", func(t *testing.T) {
	//	userInfoServer := getMockServer(t, 400, "", NoopRequestChecker)
	//	defer userInfoServer.Close()
	//	asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{UserInfoURL: &userInfoServer.URL}}}
	//	userID := primitive.NewObjectID()
	//
	//	var taskResult = make(chan TaskResult)
	//	go asanaTask.GetTasks(userID, "sample_account@email.com", taskResult)
	//	result := <-taskResult
	//	assert.NotEqual(t, nil, result.Error)
	//	assert.Equal(t, "bad status code: 400", result.Error.Error())
	//	assert.Equal(t, 0, len(result.Tasks))
	//})
	//t.Run("BadUserInfoResponse", func(t *testing.T) {
	//	userInfoServer := getMockServer(t, 200, `oopsie poopsie`, NoopRequestChecker)
	//	defer userInfoServer.Close()
	//	asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{UserInfoURL: &userInfoServer.URL}}}
	//	userID := primitive.NewObjectID()
	//
	//	var taskResult = make(chan TaskResult)
	//	go asanaTask.GetTasks(userID, "sample_account@email.com", taskResult)
	//	result := <-taskResult
	//	assert.NotEqual(t, nil, result.Error)
	//	assert.Equal(t, "invalid character 'o' looking for beginning of value", result.Error.Error())
	//	assert.Equal(t, 0, len(result.Tasks))
	//})
	//t.Run("NoWorkspaceInUserInfo", func(t *testing.T) {
	//	userInfoServer := getMockServer(t, 200, `{"data": {"workspaces": []}}`, NoopRequestChecker)
	//	defer userInfoServer.Close()
	//	asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{UserInfoURL: &userInfoServer.URL}}}
	//	userID := primitive.NewObjectID()
	//
	//	var taskResult = make(chan TaskResult)
	//	go asanaTask.GetTasks(userID, "sample_account@email.com", taskResult)
	//	result := <-taskResult
	//	assert.NotEqual(t, nil, result.Error)
	//	assert.Equal(t, "user has not workspaces", result.Error.Error())
	//	assert.Equal(t, 0, len(result.Tasks))
	//})
	//t.Run("BadTaskStatusCode", func(t *testing.T) {
	//	taskServer := getMockServer(t, 409, ``, NoopRequestChecker)
	//	defer taskServer.Close()
	//	asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{
	//		TaskFetchURL: &taskServer.URL,
	//		UserInfoURL:  &userInfoServerSuccess.URL,
	//	}}}
	//	userID := primitive.NewObjectID()
	//
	//	var taskResult = make(chan TaskResult)
	//	go asanaTask.GetTasks(userID, "sample_account@email.com", taskResult)
	//	result := <-taskResult
	//	assert.NotEqual(t, nil, result.Error)
	//	assert.Equal(t, "bad status code: 409", result.Error.Error())
	//	assert.Equal(t, 0, len(result.Tasks))
	//})
	//t.Run("BadTaskResponse", func(t *testing.T) {
	//	taskServer := getMockServer(t, 200, `to the moon`, NoopRequestChecker)
	//	defer taskServer.Close()
	//	asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{
	//		TaskFetchURL: &taskServer.URL,
	//		UserInfoURL:  &userInfoServerSuccess.URL,
	//	}}}
	//	userID := primitive.NewObjectID()
	//
	//	var taskResult = make(chan TaskResult)
	//	go asanaTask.GetTasks(userID, "sample_account@email.com", taskResult)
	//	result := <-taskResult
	//	assert.NotEqual(t, nil, result.Error)
	//	assert.Equal(t, "invalid character 'o' in literal true (expecting 'r')", result.Error.Error())
	//	assert.Equal(t, 0, len(result.Tasks))
	//})
	t.Run("Success", func(t *testing.T) {
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL:  &userInfoServerSuccess.URL,
					TaskFetchURL: &taskServerSuccess.URL,
				},
			},
		}}
		userID := primitive.NewObjectID()

		dueDate, _ := time.Parse("2006-01-02", "2021-04-20")
		createdAt, _ := time.Parse("2006-01-02", "2019-04-20")
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
				DueDate:           primitive.NewDateTimeFromTime(dueDate),
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(userID, "sample_account@email.com", taskResult)
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
		userID := primitive.NewObjectID()

		dueDate, _ := time.Parse("2006-01-02", "2001-04-21")
		createdAt, _ := time.Parse("2006-01-02", "2019-04-20")
		expectedTask := database.Item{
			TaskBase: database.TaskBase{
				IDOrdering:        0,
				IDExternal:        "test-issue-id-1",
				IDTaskSection:     constants.IDTaskSectionDefault,
				IsCompleted:       true,
				Deeplink:          "https://example.com/",
				Title:             "wrong test title",
				Body:              "wrgong test description",
				SourceID:          TASK_SOURCE_ID_LINEAR,
				SourceAccountID:   "sugapapa",
				UserID:            userID,
				CreatedAtExternal: primitive.NewDateTimeFromTime(createdAt),
				DueDate:           primitive.NewDateTimeFromTime(dueDate),
				TimeAllocation:    time.Hour.Nanoseconds(),
			},
			TaskType: database.TaskType{
				IsTask: true,
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
		dueDateCorrect, _ := time.Parse("2006-01-02", "2021-04-20")
		expectedTask.DueDate = primitive.NewDateTimeFromTime(dueDateCorrect)
		expectedTask.Title = "test title"
		expectedTask.TaskBase.Body = "test description"

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
		assert.Equal(t, "sugapapa", taskFromDB.SourceAccountID) // doesn't get updated
	})
}
