package api

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/testutils"
	"go.mongodb.org/mongo-driver/bson"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestEventDelete(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	eventCollection := database.GetCalendarEventCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	insertResult, err := eventCollection.InsertOne(dbCtx, database.CalendarEvent{
		UserID:     userID,
		IDExternal: "sample_calendar_id",
		SourceID:   external.TASK_SOURCE_ID_GCAL,
	})
	assert.NoError(t, err)
	calendarTaskID := insertResult.InsertedID.(primitive.ObjectID)
	calendarTaskIDHex := calendarTaskID.Hex()

	calendarDeleteServer := testutils.GetMockAPIServer(t, 200, "[]")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	api.ExternalConfig.GoogleOverrideURLs.CalendarDeleteURL = &calendarDeleteServer.URL
	router := GetRouter(api)

	UnauthorizedTest(t, "DELETE", "/events/delete/"+calendarTaskIDHex+"/", nil)
	t.Run("InvalidHex", func(t *testing.T) {
		ServeRequest(t, authToken, "DELETE", "/events/delete/"+calendarTaskIDHex+"1/", nil, http.StatusNotFound, nil)
	})

	t.Run("InvalidUser", func(t *testing.T) {
		secondAuthToken := login("tester@generaltask.com", "")
		ServeRequest(t, secondAuthToken, "DELETE", "/events/delete/"+calendarTaskIDHex+"1/", nil, http.StatusNotFound, nil)
	})

	t.Run("MarkAsDoneSuccess", func(t *testing.T) {
		var event database.CalendarEvent
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = eventCollection.FindOne(dbCtx, bson.M{"_id": calendarTaskID}).Decode(&event)
		assert.Equal(t, "sample_calendar_id", event.IDExternal)

		request, _ := http.NewRequest(
			"DELETE",
			"/events/delete/"+calendarTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		count, _ := eventCollection.CountDocuments(dbCtx, bson.M{"_id": calendarTaskID})
		assert.Equal(t, int64(0), count)
	})
}
