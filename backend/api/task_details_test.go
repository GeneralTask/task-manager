package api

import (
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestTaskDetail(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.com", "General Tasker")
	userID := getUserIDFromAuthToken(t, db, authToken)
	notUserID := primitive.NewObjectID()

	jiraTaskIDHex := insertTestTask(t, userID, database.Item{
		TaskBase: database.TaskBase{
			UserID:     userID,
			IDExternal: "sample_jira_id",
			SourceID:   external.TASK_SOURCE_ID_JIRA,
		},
		TaskType: database.TaskType{IsTask: true},
	})
	nonUserTaskIDHex := insertTestTask(t, userID, database.Item{
		TaskBase: database.TaskBase{
			UserID:     notUserID,
			IDExternal: "sample_jira_id_2",
			SourceID:   external.TASK_SOURCE_ID_JIRA,
		},
		TaskType: database.TaskType{IsTask: true},
	})
	router := GetRouter(GetAPI())

	t.Run("InvalidTaskID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/tasks/detail/%s/", primitive.NewObjectID().Hex()),
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"task not found\"}", string(body))
	})
	t.Run("TaskDoesNotBelongToUser", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/tasks/detail/%s/", nonUserTaskIDHex),
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"task not found\"}", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/tasks/detail/%s/", jiraTaskIDHex),
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t,
			fmt.Sprintf(`{"id":"%s","id_ordering":0,"source":{"name":"Jira","logo":"/images/jira.svg","logo_v2":"jira","is_completable":true,"is_replyable":false},"deeplink":"","title":"","body":"","sender":"","recipients":{"to":[],"cc":[],"bcc":[]},"due_date":"","time_allocated":0,"sent_at":"1969-12-31T18:00:00-06:00","is_done":false}`, jiraTaskIDHex),
			string(body))
	})
}

func insertTestTask(t *testing.T, userID primitive.ObjectID, task database.Item) string {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	insertResult, err := taskCollection.InsertOne(context.Background(), task)
	assert.NoError(t, err)
	taskID := insertResult.InsertedID.(primitive.ObjectID)
	taskIDHex := taskID.Hex()
	return taskIDHex
}
