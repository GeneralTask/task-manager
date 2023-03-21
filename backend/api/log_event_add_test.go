package api

import (
	"bytes"
	"context"
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestLogEventAdd(t *testing.T) {
	authToken := login("approved@generaltask.com", "")
	UnauthorizedTest(t, "POST", "/log_events/", nil)
	t.Run("EmptyPayload", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "POST", "/log_events/", nil, http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'event_type' parameter.\"}", string(responseBody))
	})
	t.Run("MissingEventType", func(t *testing.T) {
		requestBody := bytes.NewBuffer([]byte(`{"foo": "bar"}`))
		responseBody := ServeRequest(t, authToken, "POST", "/log_events/", requestBody, http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'event_type' parameter.\"}", string(responseBody))
	})
	t.Run("BadEventType", func(t *testing.T) {
		requestBody := bytes.NewBuffer([]byte(`{"event_type": 1}`))
		responseBody := ServeRequest(t, authToken, "POST", "/log_events/", requestBody, http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'event_type' parameter.\"}", string(responseBody))
	})
	t.Run("Success", func(t *testing.T) {
		addLogEvent(t, authToken)
		addLogEvent(t, authToken)

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		count, err := database.GetLogEventsCollection(db).CountDocuments(
			context.Background(),
			bson.M{"event_type": "to_the_moon"},
		)
		assert.NoError(t, err)
		assert.Equal(t, int64(2), count)
	})
}

func addLogEvent(t *testing.T, authToken string) {
	requestBody := bytes.NewBuffer([]byte(`{"event_type": "to_the_moon"}`))
	responseBody := ServeRequest(t, authToken, "POST", "/log_events/", requestBody, http.StatusCreated, nil)
	assert.Equal(t, "{}", string(responseBody))
}
