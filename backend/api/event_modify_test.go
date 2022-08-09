package api

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
)

// see gcal_test.go for success tests
func TestInvalidEventModify(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)
	accountID := "duccount_id"

	taskCollection := database.GetTaskCollection(db)
	event, err := taskCollection.InsertOne(parentCtx, database.Item{
		TaskBase: database.TaskBase{
			UserID:     userID,
			IDExternal: accountID,
			SourceID:   external.TASK_SOURCE_ID_GCAL,
			Title:      "initial summary",
			Body:       "initial description",
		},
	})
	assert.NoError(t, err)
	eventObjectID := event.InsertedID.(primitive.ObjectID)
	eventID := eventObjectID.Hex()
	validUrl := fmt.Sprintf("/events/modify/%s/", eventID)

	calendarModifyServer := testutils.GetMockAPIServer(t, 200, "{}")
	api := GetAPI()
	api.ExternalConfig.GoogleOverrideURLs.CalendarFetchURL = &calendarModifyServer.URL
	router := GetRouter(api)

	t.Run("Success", func(t *testing.T) {
		body := bytes.NewBuffer([]byte(`{
			"account_id": "duck@duck.com", 
			"summary": "new summary",
			"description": "new description",
			"datetime_start": "2020-01-01T00:00:00Z",
			"datetime_end": "2020-02-01T00:00:00Z"
		}`))
		request, _ := http.NewRequest(
			"PATCH",
			"/events/modify/"+eventID+"/",
			body)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		event, err := database.GetItem(dbCtx, eventObjectID, userID)
		assert.NoError(t, err)
		assert.Equal(t, "new summary", event.Title)
		assert.Equal(t, "new description", event.Body)
		// assert that start and end times are correct
		assert.Equal(t, primitive.DateTime(1577836800000), event.DatetimeStart)
		assert.Equal(t, primitive.DateTime(1577836800000), event.DatetimeStart)
	})
	UnauthorizedTest(t, "PATCH", validUrl, bytes.NewBuffer([]byte(`{"account_id": "duck@duck.com", "summary": "duck"}`)))
	t.Run("NoBody", func(t *testing.T) {
		ServeRequest(t, authToken, "PATCH", validUrl, nil, http.StatusBadRequest)
	})
	t.Run("EmptyBody", func(t *testing.T) {
		body := bytes.NewBuffer([]byte(`{}`))
		ServeRequest(t, authToken, "PATCH", validUrl, body, http.StatusBadRequest)
	})
	t.Run("MissingModifyParams", func(t *testing.T) {
		body := bytes.NewBuffer([]byte(`{"account_id": "duck@duck.com"}`))
		ServeRequest(t, authToken, "PATCH", validUrl, body, http.StatusBadRequest)
	})
	t.Run("InvalidEventID", func(t *testing.T) {
		body := bytes.NewBuffer([]byte(`{"account_id": "duck@duck.com", "summary": "duck"}`))
		ServeRequest(t, authToken, "PATCH", "/events/modify/bad_id/", body, http.StatusBadRequest)
	})
	t.Run("EventIDFromOtherUser", func(t *testing.T) {
		otherUserAuthToken := login("otheruser@aol.com", "")

		body := bytes.NewBuffer([]byte(`{"account_id": "duck@duck.com", "summary": "duck"}`))
		ServeRequest(t, otherUserAuthToken, "PATCH", validUrl, body, http.StatusUnauthorized)
	})
}
