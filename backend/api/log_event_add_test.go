package api

import (
	"bytes"
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestLogEventAdd(t *testing.T) {
	parentCtx := context.Background()
	authToken := login("approved@generaltask.com", "")
	UnauthorizedTest(t, "POST", "/log_events/", nil)
	t.Run("EmptyPayload", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("POST", "/log_events/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'event_type' parameter.\"}", string(body))
	})
	t.Run("MissingEventType", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"POST",
			"/log_events/",
			bytes.NewBuffer([]byte(`{"foo": "bar"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'event_type' parameter.\"}", string(body))
	})
	t.Run("BadEventType", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"POST",
			"/log_events/",
			bytes.NewBuffer([]byte(`{"event_type": 1}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'event_type' parameter.\"}", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		addLogEvent(t, authToken)
		addLogEvent(t, authToken)

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		count, err := database.GetLogEventsCollection(db).CountDocuments(
			dbCtx,
			bson.M{"event_type": "to_the_moon"},
		)
		assert.NoError(t, err)
		assert.Equal(t, int64(2), count)
	})
}

func addLogEvent(t *testing.T, authToken string) {
	router := GetRouter(GetAPI())
	request, _ := http.NewRequest(
		"POST",
		"/log_events/",
		bytes.NewBuffer([]byte(`{"event_type": "to_the_moon"}`)))
	request.Header.Add("Authorization", "Bearer "+authToken)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, 201, recorder.Code)
	body, err := ioutil.ReadAll(recorder.Body)
	assert.NoError(t, err)
	assert.Equal(t, "{}", string(body))
}
