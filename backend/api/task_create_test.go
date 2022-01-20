package api

import (
	"bytes"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
)

func TestCreateTask(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.com", "")
	router := GetRouter(GetAPI())

	t.Run("BadSourceID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/tasks/create/dogecoin/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("UnsupportedSourceID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/tasks/create/gmail/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("MissingTitle", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/tasks/create/gt_task/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing parameter.\"}", string(body))
	})
	t.Run("WrongAccountID", func(t *testing.T) {
		// this currently isn't possible because only GT tasks are supported, but we should add this when it's possible
	})
	t.Run("SuccessTitleOnly", func(t *testing.T) {
		authToken := login("create_task_success_title_only@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		request, _ := http.NewRequest(
			"POST",
			"/tasks/create/gt_task/",
			bytes.NewBuffer([]byte(`{"title": "buy more dogecoin"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		task := (*tasks)[0]
		assert.Equal(t, "buy more dogecoin", task.Title)
		assert.Equal(t, "", task.Body)
		assert.Equal(t, external.GeneralTaskDefaultAccountID, task.SourceAccountID)
		// 1 hour is the default
		assert.Equal(t, int64(3600000000000), task.TimeAllocation)
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("create_task_success@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		request, _ := http.NewRequest(
			"POST",
			"/tasks/create/gt_task/",
			bytes.NewBuffer([]byte(`{"title": "buy more dogecoin", "body": "seriously!", "due_date": "2020-12-09T16:09:53+00:00", "time_duration": 300}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		task := (*tasks)[0]
		assert.Equal(t, "buy more dogecoin", task.Title)
		assert.Equal(t, "seriously!", task.Body)
		assert.Equal(t, int64(300000000000), task.TimeAllocation)
		assert.Equal(t, external.GeneralTaskDefaultAccountID, task.SourceAccountID)
	})
}
