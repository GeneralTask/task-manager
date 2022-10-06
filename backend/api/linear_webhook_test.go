package api

import (
	"bytes"
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
)

func TestProcessComments(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("proccess_comments@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	userInfoServerSuccess := testutils.GetMockAPIServer(t, 200, `{"data": {
		"user": {
			"id": "userIDExternal",
			"name": "Test User",
			"email": "test@generaltask.com"
		}
	}}`)

	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	api.ExternalConfig.Linear.ConfigValues.UserInfoURL = &userInfoServerSuccess.URL
	router := GetRouter(api)

	taskCollection := database.GetTaskCollection(db)
	taskCollection.InsertOne(context.Background(), database.Task{
		IDExternal:      "externalID",
		UserID:          userID,
		SourceAccountID: "example account ID",
	})

	externalAPICollection := database.GetExternalTokenCollection(db)
	externalAPICollection.InsertOne(context.Background(), database.ExternalAPIToken{
		UserID:     userID,
		ServiceID:  external.TASK_SERVICE_ID_LINEAR,
		AccountID:  "example account ID",
		ExternalID: "userIDExternal",
	})

	t.Run("InvalidIP", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/linear/webhook/",
			nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid request format\"}", string(body))
	})

	t.Run("InvalidFormat", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/linear/webhook/",
			bytes.NewBuffer([]byte(`"uhoh"`)),
		)
		request.Header.Add("X-Forwarded-For", ValidLinearIP1)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"unable to process linear webhook payload\"}", string(body))
	})
	t.Run("InvalidType", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/linear/webhook/",
			bytes.NewBuffer([]byte(`{"action":"remove","createdAt":"2022-10-05T18:36:25.922Z","data":{"id":"e17bd25c-fa0b-49a0-8658-82fbec96427f","createdAt":"2022-10-05T18:12:23.127Z","updatedAt":"2022-10-05T18:18:54.049Z","body":"here we","issueId":"7ca5cb7c-9038-4f72-b880-f4209e1d1466","userId":"c4665594-0dc5-4913-8102-cbfa03ec8a69","editedAt":"2022-10-05T18:18:54.049Z","issue":{"id":"7ca5cb7c-9038-4f72-b880-f4209e1d1466","title":"New issue for modification purposes"},"user":{"id":"c4665594-0dc5-4913-8102-cbfa03ec8a69","name":"Julian Christensen"}},"type":"InvalidType","organizationId":"572f6728-59c0-4844-96b1-34b5e77b704e"}`)),
		)
		request.Header.Add("X-Forwarded-For", ValidLinearIP1)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"unrecognized linear payload format\"}", string(body))
	})
	t.Run("InvalidTaskID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/linear/webhook/",
			bytes.NewBuffer([]byte(`{"action":"invalid","createdAt":"2022-10-05T18:36:25.922Z","data":{"id":"e17bd25c-fa0b-49a0-8658-82fbec96427f","createdAt":"2022-10-05T18:12:23.127Z","updatedAt":"2022-10-05T18:18:54.049Z","body":"here we","issueId":"7ca5cb7c-9038-4f72-b880-f4209e1d1466","userId":"c4665594-0dc5-4913-8102-cbfa03ec8a69","editedAt":"2022-10-05T18:18:54.049Z","issue":{"id":"7ca5cb7c-9038-4f72-b880-f4209e1d1466","title":"New issue for modification purposes"},"user":{"id":"c4665594-0dc5-4913-8102-cbfa03ec8a69","name":"Julian Christensen"}},"type":"Comment","organizationId":"572f6728-59c0-4844-96b1-34b5e77b704e"}`)),
		)
		request.Header.Add("X-Forwarded-For", ValidLinearIP1)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"unable to process linear comment webhook\"}", string(body))
	})
	t.Run("InvalidAction", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/linear/webhook/",
			bytes.NewBuffer([]byte(`{"action":"invalid","createdAt":"2022-10-05T18:36:25.922Z","data":{"id":"e17bd25c-fa0b-49a0-8658-82fbec96427f","createdAt":"2022-10-05T18:12:23.127Z","updatedAt":"2022-10-05T18:18:54.049Z","body":"here we","issueId":"externalID","userId":"c4665594-0dc5-4913-8102-cbfa03ec8a69","editedAt":"2022-10-05T18:18:54.049Z","issue":{"id":"7ca5cb7c-9038-4f72-b880-f4209e1d1466","title":"New issue for modification purposes"},"user":{"id":"c4665594-0dc5-4913-8102-cbfa03ec8a69","name":"Julian Christensen"}},"type":"Comment","organizationId":"572f6728-59c0-4844-96b1-34b5e77b704e"}`)),
		)
		request.Header.Add("X-Forwarded-For", ValidLinearIP1)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"unable to process linear comment webhook\"}", string(body))
	})
	t.Run("CreateCommentSuccess", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/linear/webhook/",
			bytes.NewBuffer([]byte(`{"action":"create","createdAt":"2022-10-05T19:00:34.481Z","data":{"id":"ce5fc6ad-14f4-4b52-8a34-613b3ee5c9f1","createdAt":"2022-10-05T19:00:34.481Z","updatedAt":"2022-10-05T19:00:34.481Z","body":"here's a new one!","issueId":"externalID","userId":"userIDExternal","issue":{"id":"externalID","title":"New issue for modification purposes"},"user":{"id":"userIDExternal","name":"Julian Christensen"}},"url":"https://linear.app/general-task/issue/BACK-317#comment-ce5fc6ad","type":"Comment","organizationId":"572f6728-59c0-4844-96b1-34b5e77b704e"}`)),
		)
		request.Header.Add("X-Forwarded-For", ValidLinearIP1)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		task, err := database.GetTaskByExternalIDWithoutUser(db, "externalID")
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*task.Comments))
	})
	t.Run("CreateExistingCommentSuccess", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/linear/webhook/",
			bytes.NewBuffer([]byte(`{"action":"create","createdAt":"2022-10-05T19:00:34.481Z","data":{"id":"ce5fc6ad-14f4-4b52-8a34-613b3ee5c9f1","createdAt":"2022-10-05T19:00:34.481Z","updatedAt":"2022-10-05T19:00:34.481Z","body":"here's a new one!","issueId":"externalID","userId":"userIDExternal","issue":{"id":"externalID","title":"New issue for modification purposes"},"user":{"id":"userIDExternal","name":"Julian Christensen"}},"url":"https://linear.app/general-task/issue/BACK-317#comment-ce5fc6ad","type":"Comment","organizationId":"572f6728-59c0-4844-96b1-34b5e77b704e"}`)),
		)
		request.Header.Add("X-Forwarded-For", ValidLinearIP1)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		task, err := database.GetTaskByExternalIDWithoutUser(db, "externalID")
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*task.Comments))
	})
	t.Run("CreateSecondCommentSuccess", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/linear/webhook/",
			bytes.NewBuffer([]byte(`{"action":"create","createdAt":"2022-10-05T19:00:34.481Z","data":{"id":"new comment id","createdAt":"2022-10-05T19:00:34.481Z","updatedAt":"2022-10-05T19:00:34.481Z","body":"here's a w one!","issueId":"externalID","userId":"userIDExternal","issue":{"id":"externalID","title":"New issue for modification purposes"},"user":{"id":"userIDExternal","name":"Julian Christensen"}},"url":"https://linear.app/general-task/issue/BACK-317#comment-ce5fc6ad","type":"Comment","organizationId":"572f6728-59c0-4844-96b1-34b5e77b704e"}`)),
		)
		request.Header.Add("X-Forwarded-For", ValidLinearIP1)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		task, err := database.GetTaskByExternalIDWithoutUser(db, "externalID")
		assert.NoError(t, err)
		assert.Equal(t, 2, len(*task.Comments))
	})
	t.Run("UpdateCommentSuccess", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/linear/webhook/",
			bytes.NewBuffer([]byte(`{"action":"update","createdAt":"2022-10-05T19:00:34.481Z","data":{"id":"ce5fc6ad-14f4-4b52-8a34-613b3ee5c9f1","createdAt":"2022-10-05T19:00:34.481Z","updatedAt":"2022-10-05T19:00:34.481Z","body":"modified text","issueId":"externalID","userId":"userIDExternal","issue":{"id":"externalID","title":"New issue for modification purposes"},"user":{"id":"userIDExternal","name":"Julian Christensen"}},"url":"https://linear.app/general-task/issue/BACK-317#comment-ce5fc6ad","type":"Comment","organizationId":"572f6728-59c0-4844-96b1-34b5e77b704e"}`)),
		)
		request.Header.Add("X-Forwarded-For", ValidLinearIP1)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		task, err := database.GetTaskByExternalIDWithoutUser(db, "externalID")
		assert.NoError(t, err)
		assert.Equal(t, 2, len(*task.Comments))
		assert.Equal(t, "modified text", (*task.Comments)[0].Body)
	})
	t.Run("RemoveCommentSuccess", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/linear/webhook/",
			bytes.NewBuffer([]byte(`{"action":"remove","createdAt":"2022-10-05T19:00:34.481Z","data":{"id":"ce5fc6ad-14f4-4b52-8a34-613b3ee5c9f1","createdAt":"2022-10-05T19:00:34.481Z","updatedAt":"2022-10-05T19:00:34.481Z","body":"here's a new one!","issueId":"externalID","userId":"userIDExternal","issue":{"id":"externalID","title":"New issue for modification purposes"},"user":{"id":"userIDExternal","name":"Julian Christensen"}},"url":"https://linear.app/general-task/issue/BACK-317#comment-ce5fc6ad","type":"Comment","organizationId":"572f6728-59c0-4844-96b1-34b5e77b704e"}`)),
		)
		request.Header.Add("X-Forwarded-For", ValidLinearIP1)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		task, err := database.GetTaskByExternalIDWithoutUser(db, "externalID")
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*task.Comments))
	})
}
