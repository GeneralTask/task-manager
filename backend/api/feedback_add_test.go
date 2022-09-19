package api

import (
	"bytes"
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestFeedbackAdd(t *testing.T) {
	authToken := login("approved@generaltask.com", "")
	UnauthorizedTest(t, "POST", "/feedback/", nil)
	t.Run("EmptyPayload", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("POST", "/feedback/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'feedback' parameter.\"}", string(body))
	})
	t.Run("MissingFeedback", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"POST",
			"/feedback/",
			bytes.NewBuffer([]byte(`{"foo": "bar"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'feedback' parameter.\"}", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"POST",
			"/feedback/",
			bytes.NewBuffer([]byte(`{"feedback": "I don't like it one bit!"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusCreated, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

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
	})
}
