package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type eventCreateResponse struct {
	ID primitive.ObjectID `json:"id"`
}

func TestEventCreate(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("TestEventCreate@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)
	url := "/events/create/gcal/"
	startTime, _ := time.Parse(time.RFC3339, "2022-08-21T12:30:00.000-07:00")
	endTime, _ := time.Parse(time.RFC3339, "2022-08-21T12:45:00.000-07:00")

	calendarCreateServer := testutils.GetMockAPIServer(t, 200, "{}")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	api.ExternalConfig.GoogleOverrideURLs.CalendarCreateURL = &calendarCreateServer.URL

	defaultEventCreateObject := external.EventCreateObject{
		AccountID:     "duck@test.com",
		Summary:       "summary",
		Description:   "description",
		DatetimeStart: &startTime,
		DatetimeEnd:   &endTime,
	}

	UnauthorizedTest(t, "POST", url, bytes.NewBuffer([]byte(`{"account_id": "duck@duck.com", "summary": "duck"}`)))
	t.Run("SuccessNoLinkedTask", func(t *testing.T) {
		eventID := makeCreateRequest(t, &defaultEventCreateObject, http.StatusCreated, "", url, authToken, api)
		dbEvent, err := database.GetCalendarEvent(api.DB, eventID, userID)
		assert.NoError(t, err)
		assert.Equal(t, eventID, dbEvent.ID)
		checkEventMatchesCreateObject(t, *dbEvent, defaultEventCreateObject)
	})
	t.Run("SuccessNoLinkedTaskWithCalendarID", func(t *testing.T) {
		eventCreateObj := defaultEventCreateObject
		eventCreateObj.CalendarID = "calendar_id"
		eventID := makeCreateRequest(t, &eventCreateObj, http.StatusCreated, "", url, authToken, api)
		dbEvent, err := database.GetCalendarEvent(api.DB, eventID, userID)
		assert.NoError(t, err)
		assert.Equal(t, eventID, dbEvent.ID)
		checkEventMatchesCreateObject(t, *dbEvent, eventCreateObj)
	})
	t.Run("SuccessLinkedView", func(t *testing.T) {
		viewCollection := database.GetViewCollection(db)
		mongoResult, err := viewCollection.InsertOne(context.Background(), database.View{
			UserID: userID,
		})
		assert.NoError(t, err)
		viewID := mongoResult.InsertedID.(primitive.ObjectID)
		eventCreateObject := defaultEventCreateObject
		eventCreateObject.LinkedViewID = viewID

		eventID := makeCreateRequest(t, &eventCreateObject, http.StatusCreated, "", url, authToken, api)
		dbEvent, err := database.GetCalendarEvent(api.DB, eventID, userID)
		assert.NoError(t, err)
		assert.Equal(t, eventID, dbEvent.ID)
		checkEventMatchesCreateObject(t, *dbEvent, eventCreateObject)
	})
	t.Run("SuccessLinkedTask", func(t *testing.T) {
		taskCollection := database.GetTaskCollection(db)
		title := "task title"
		body := "task body"
		mongoResult, err := taskCollection.InsertOne(context.Background(), database.Task{
			Title:  &title,
			Body:   &body,
			UserID: userID,
		})
		assert.NoError(t, err)
		taskID := mongoResult.InsertedID.(primitive.ObjectID)
		eventCreateObject := defaultEventCreateObject
		eventCreateObject.LinkedTaskID = taskID

		eventID := makeCreateRequest(t, &eventCreateObject, http.StatusCreated, "", url, authToken, api)
		dbEvent, err := database.GetCalendarEvent(api.DB, eventID, userID)
		assert.NoError(t, err)
		assert.Equal(t, eventID, dbEvent.ID)
		checkEventMatchesCreateObject(t, *dbEvent, eventCreateObject)
	})
	t.Run("SuccessLinkedPR", func(t *testing.T) {
		prCollection := database.GetPullRequestCollection(db)
		title := "task title"
		mongoResult, err := prCollection.InsertOne(context.Background(), database.PullRequest{
			Title:  title,
			UserID: userID,
		})
		assert.NoError(t, err)
		prID := mongoResult.InsertedID.(primitive.ObjectID)
		eventCreateObject := defaultEventCreateObject
		eventCreateObject.LinkedPullRequestID = prID

		eventID := makeCreateRequest(t, &eventCreateObject, http.StatusCreated, "", url, authToken, api)
		dbEvent, err := database.GetCalendarEvent(api.DB, eventID, userID)
		assert.NoError(t, err)
		assert.Equal(t, eventID, dbEvent.ID)
		checkEventMatchesCreateObject(t, *dbEvent, eventCreateObject)
	})
	t.Run("NonExistentLinkedView", func(t *testing.T) {
		eventCreateObject := defaultEventCreateObject
		nonExistentLinkedViewID := primitive.NewObjectID()
		eventCreateObject.LinkedViewID = nonExistentLinkedViewID
		makeCreateRequest(t, &eventCreateObject, http.StatusBadRequest, fmt.Sprintf(`{"detail":"linked view not found: %s"}`, nonExistentLinkedViewID.Hex()), url, authToken, api)
	})
	t.Run("LinkedViewFromWrongUser", func(t *testing.T) {
		viewCollection := database.GetViewCollection(db)
		mongoResult, err := viewCollection.InsertOne(context.Background(), database.View{
			UserID: primitive.NewObjectID(),
		})
		assert.NoError(t, err)
		viewID := mongoResult.InsertedID.(primitive.ObjectID)
		eventCreateObject := defaultEventCreateObject
		eventCreateObject.LinkedViewID = viewID
		makeCreateRequest(t, &eventCreateObject, http.StatusBadRequest, fmt.Sprintf(`{"detail":"linked view not found: %s"}`, viewID.Hex()), url, authToken, api)
	})
	t.Run("NonExistentLinkedTask", func(t *testing.T) {
		eventCreateObject := defaultEventCreateObject
		nonExistentLinkedTaskID := primitive.NewObjectID()
		eventCreateObject.LinkedTaskID = nonExistentLinkedTaskID
		makeCreateRequest(t, &eventCreateObject, http.StatusBadRequest, fmt.Sprintf(`{"detail":"linked task not found: %s"}`, nonExistentLinkedTaskID.Hex()), url, authToken, api)
	})
	t.Run("LinkedTaskFromWrongUser", func(t *testing.T) {
		taskCollection := database.GetTaskCollection(db)
		title := "task title"
		body := "task body"
		mongoResult, err := taskCollection.InsertOne(context.Background(), database.Task{
			Title:  &title,
			Body:   &body,
			UserID: primitive.NewObjectID(),
		})
		assert.NoError(t, err)
		taskID := mongoResult.InsertedID.(primitive.ObjectID)
		eventCreateObject := defaultEventCreateObject
		eventCreateObject.LinkedTaskID = taskID
		makeCreateRequest(t, &eventCreateObject, http.StatusBadRequest, fmt.Sprintf(`{"detail":"linked task not found: %s"}`, taskID.Hex()), url, authToken, api)
	})
	t.Run("NonExistentLinkedPR", func(t *testing.T) {
		eventCreateObject := defaultEventCreateObject
		nonExistentLinkedPRID := primitive.NewObjectID()
		eventCreateObject.LinkedPullRequestID = nonExistentLinkedPRID
		makeCreateRequest(t, &eventCreateObject, http.StatusBadRequest, fmt.Sprintf(`{"detail":"linked PR not found: %s"}`, nonExistentLinkedPRID.Hex()), url, authToken, api)
	})
	t.Run("LinkedPRFromWrongUser", func(t *testing.T) {
		prCollection := database.GetPullRequestCollection(db)
		title := "task title"
		mongoResult, err := prCollection.InsertOne(context.Background(), database.PullRequest{
			Title:  title,
			UserID: primitive.NewObjectID(),
		})
		assert.NoError(t, err)
		prID := mongoResult.InsertedID.(primitive.ObjectID)
		eventCreateObject := defaultEventCreateObject
		eventCreateObject.LinkedPullRequestID = prID
		makeCreateRequest(t, &eventCreateObject, http.StatusBadRequest, fmt.Sprintf(`{"detail":"linked PR not found: %s"}`, prID.Hex()), url, authToken, api)
	})
	t.Run("UnsupportedService", func(t *testing.T) {
		body, err := json.Marshal(defaultEventCreateObject)
		assert.NoError(t, err)
		ServeRequest(t, authToken, "POST", "/events/create/linear/", bytes.NewBuffer(body), http.StatusNotFound, nil)
	})
	t.Run("MissingAccountID", func(t *testing.T) {
		eventCreateObject := defaultEventCreateObject
		eventCreateObject.AccountID = ""
		makeCreateRequest(t, &eventCreateObject, http.StatusBadRequest, `{"detail":"invalid or missing parameter."}`, url, authToken, api)
	})
	t.Run("MissingStartTime", func(t *testing.T) {
		eventCreateObject := defaultEventCreateObject
		eventCreateObject.DatetimeStart = nil
		makeCreateRequest(t, &eventCreateObject, http.StatusBadRequest, `{"detail":"invalid or missing parameter."}`, url, authToken, api)
	})
	t.Run("MissingEndTime", func(t *testing.T) {
		eventCreateObject := defaultEventCreateObject
		eventCreateObject.DatetimeEnd = nil
		makeCreateRequest(t, &eventCreateObject, http.StatusBadRequest, `{"detail":"invalid or missing parameter."}`, url, authToken, api)
	})
}

func checkEventMatchesCreateObject(t *testing.T, event database.CalendarEvent, createObject external.EventCreateObject) {
	assert.Equal(t, createObject.AccountID, event.SourceAccountID)
	assert.Equal(t, createObject.CalendarID, event.CalendarID)
	assert.Equal(t, createObject.Summary, event.Title)
	assert.Equal(t, createObject.Description, event.Body)
	assert.Equal(t, primitive.NewDateTimeFromTime(*createObject.DatetimeStart), event.DatetimeStart)
	assert.Equal(t, primitive.NewDateTimeFromTime(*createObject.DatetimeEnd), event.DatetimeEnd)
	assert.Equal(t, createObject.LinkedTaskID, event.LinkedTaskID)
	assert.Equal(t, createObject.LinkedViewID, event.LinkedViewID)
	assert.Equal(t, createObject.LinkedPullRequestID, event.LinkedPullRequestID)
}

func makeCreateRequest(t *testing.T, eventCreateObject *external.EventCreateObject, expectedStatus int, expectedErrorResponse string, url string, authToken string, api *API) primitive.ObjectID {
	body, err := json.Marshal(*eventCreateObject)
	assert.NoError(t, err)
	response := ServeRequest(t, authToken, "POST", url, bytes.NewBuffer(body), expectedStatus, api)
	// if this request should succeed
	if expectedStatus == http.StatusCreated && expectedErrorResponse == "" {
		responseObject := eventCreateResponse{}
		err = json.Unmarshal(response, &responseObject)
		assert.NoError(t, err)
		assert.NotEqual(t, primitive.NilObjectID, responseObject.ID)
		return responseObject.ID
	} else {
		assert.Equal(t, expectedErrorResponse, string(response))
		return primitive.NilObjectID
	}
}
