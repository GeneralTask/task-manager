package api

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
)

func TestEventModify(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("TestInvalidEventModify@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)
	accountID := "duck@duck.com"

	eventCollection := database.GetCalendarEventCollection(db)
	event, err := eventCollection.InsertOne(context.Background(), database.CalendarEvent{
		UserID:        userID,
		IDExternal:    accountID,
		SourceID:      external.TASK_SOURCE_ID_GCAL,
		Title:         "initial summary",
		Body:          "initial description",
		DatetimeStart: primitive.DateTime(1609559200000),
		DatetimeEnd:   primitive.DateTime(1609459200000),
	})
	assert.NoError(t, err)
	eventObjectID := event.InsertedID.(primitive.ObjectID)
	eventID := eventObjectID.Hex()
	validUrl := fmt.Sprintf("/events/modify/%s/", eventID)

	calendarModifyServer := testutils.GetMockAPIServer(t, 200, "{}")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	api.ExternalConfig.GoogleOverrideURLs.CalendarModifyURL = &calendarModifyServer.URL
	router := GetRouter(api)

	UnauthorizedTest(t, "PATCH", validUrl, bytes.NewBuffer([]byte(`{"account_id": "duck@duck.com", "summary": "duck"}`)))
	t.Run("UpdateStartTimeSuccess", func(t *testing.T) {
		body := bytes.NewBuffer([]byte(`{
			"account_id": "duck@duck.com",
			"datetime_start": "2021-01-01T00:00:00Z"
		}`))
		request, _ := http.NewRequest(
			"PATCH",
			"/events/modify/"+eventID+"/",
			body)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		event, err := database.GetCalendarEvent(api.DB, eventObjectID, userID)
		assert.NoError(t, err)
		assert.Equal(t, "initial summary", event.Title)
		assert.Equal(t, "initial description", event.Body)
		assert.Equal(t, primitive.DateTime(1609459200000), event.DatetimeStart)
		assert.Equal(t, primitive.DateTime(1609459200000), event.DatetimeEnd)
	})
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

		event, err := database.GetCalendarEvent(api.DB, eventObjectID, userID)
		assert.NoError(t, err)
		assert.Equal(t, "new summary", event.Title)
		assert.Equal(t, "new description", event.Body)
		assert.Equal(t, primitive.DateTime(1577836800000), event.DatetimeStart)
		assert.Equal(t, primitive.DateTime(1580515200000), event.DatetimeEnd)
	})
	t.Run("NoBody", func(t *testing.T) {
		ServeRequest(t, authToken, "PATCH", validUrl, nil, http.StatusBadRequest, nil)
	})
	t.Run("EmptyBody", func(t *testing.T) {
		body := bytes.NewBuffer([]byte(`{}`))
		ServeRequest(t, authToken, "PATCH", validUrl, body, http.StatusBadRequest, nil)
	})
	t.Run("MissingModifyParams", func(t *testing.T) {
		body := bytes.NewBuffer([]byte(`{"account_id": "duck@duck.com"}`))
		ServeRequest(t, authToken, "PATCH", validUrl, body, http.StatusBadRequest, nil)
	})
	t.Run("InvalidEventID", func(t *testing.T) {
		body := bytes.NewBuffer([]byte(`{"account_id": "duck@duck.com", "summary": "duck"}`))
		ServeRequest(t, authToken, "PATCH", "/events/modify/bad_id/", body, http.StatusBadRequest, nil)
	})
	t.Run("EventIDFromOtherUser", func(t *testing.T) {
		otherUserAuthToken := login("otheruser@aol.com", "")

		body := bytes.NewBuffer([]byte(`{"account_id": "duck@duck.com", "summary": "duck"}`))
		ServeRequest(t, otherUserAuthToken, "PATCH", validUrl, body, http.StatusUnauthorized, nil)
	})
}
