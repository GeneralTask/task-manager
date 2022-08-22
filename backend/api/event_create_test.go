package api

import (
	"bytes"
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
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
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("TestInvalidEventModify@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)
	url := "/events/create/gcal/"
	startTime, _ := time.Parse(time.RFC3339, "2022-08-21T12:30:00.000-07:00")
	endTime, _ := time.Parse(time.RFC3339, "2022-08-21T12:45:00.000-07:00")

	calendarCreateServer := testutils.GetMockAPIServer(t, 200, "{}")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	api.ExternalConfig.GoogleOverrideURLs.CalendarCreateURL = &calendarCreateServer.URL
	router := GetRouter(api)

	makeCreateRequest := func(eventCreateObject *external.EventCreateObject, expectedStatus int) primitive.ObjectID {
		body, err := json.Marshal(*eventCreateObject)
		assert.NoError(t, err)
		request, _ := http.NewRequest(
			"POST",
			url,
			bytes.NewBuffer(body))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, expectedStatus, recorder.Code)
		response := eventCreateResponse{}
		responseBody, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		err = json.Unmarshal(responseBody, &response)
		assert.NoError(t, err)
		assert.NotEqual(t, primitive.NilObjectID, response.ID)
		return response.ID
	}

	UnauthorizedTest(t, "POST", url, bytes.NewBuffer([]byte(`{"account_id": "duck@duck.com", "summary": "duck"}`)))
	t.Run("SuccessNoLinkedTask", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		eventCreateObject := external.EventCreateObject{
			AccountID:     "duck@test.com",
			Summary:       "summary",
			Description:   "description",
			DatetimeStart: &startTime,
			DatetimeEnd:   &endTime,
		}
		eventID := makeCreateRequest(&eventCreateObject, http.StatusCreated)
		dbEvent, err := database.GetCalendarEvent(dbCtx, eventID, userID)
		assert.NoError(t, err)
		assert.Equal(t, eventID, dbEvent.IDExternal)
		checkEventMatchesCreateObject(t, *dbEvent, eventCreateObject)

	})
	t.Run("SuccessLinkedTask", func(t *testing.T) {

	})
}

func checkEventMatchesCreateObject(t *testing.T, event database.CalendarEvent, createObject external.EventCreateObject) {
	assert.Equal(t, createObject.AccountID, event.SourceAccountID)
	assert.Equal(t, createObject.Summary, event.Title)
	assert.Equal(t, createObject.Description, event.Body)
	assert.Equal(t, primitive.NewDateTimeFromTime(*createObject.DatetimeStart), event.DatetimeStart)
	assert.Equal(t, primitive.NewDateTimeFromTime(*createObject.DatetimeEnd), event.DatetimeEnd)
	assert.Equal(t, createObject.LinkedTaskID, event.Title)
}
