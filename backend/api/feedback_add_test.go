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

func TestFeedbackAdd(t *testing.T) {
	authToken := login("approved@generaltask.com", "Snoop Dogg")
	UnauthorizedTest(t, "POST", "/feedback/", nil)
	t.Run("EmptyPayload", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "POST", "/feedback/", nil, http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'feedback' parameter.\"}", string(responseBody))
	})
	t.Run("MissingFeedback", func(t *testing.T) {
		requestBody := bytes.NewBuffer([]byte(`{"foo": "bar"}`))
		responseBody := ServeRequest(t, authToken, "POST", "/feedback/", requestBody, http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'feedback' parameter.\"}", string(responseBody))
	})
	t.Run("Success", func(t *testing.T) {
		requestBody := bytes.NewBuffer([]byte(`{"feedback": "I don't like it one bit!"}`))
		responseBody := ServeRequest(t, authToken, "POST", "/feedback/", requestBody, http.StatusCreated, nil)
		assert.Equal(t, "{}", string(responseBody))

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		feedbackCollection := database.GetFeedbackItemCollection(db)
		count, err := feedbackCollection.CountDocuments(
			context.Background(),
			bson.M{},
		)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)

		var entry database.FeedbackItem
		err = feedbackCollection.FindOne(
			context.Background(),
			bson.M{},
		).Decode(&entry)
		assert.NoError(t, err)
		assert.Equal(t, "I don't like it one bit!", entry.Feedback)
		assert.Equal(t, "approved@generaltask.com", entry.Email)
		assert.Equal(t, "Snoop Dogg", entry.Name)
	})
}
