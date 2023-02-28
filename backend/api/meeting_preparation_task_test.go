package api

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestMeetingPreparationTask(t *testing.T) {
	authtoken := login("test_overview@generaltask.com", "")
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, db, authtoken)

	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	testTime := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)
	api.OverrideTime = &testTime
	router := GetRouter(api)

	_, err = database.UpdateOrCreateCalendarAccount(db, userID, "123abc", "foobar_source",
		&database.CalendarAccount{
			UserID:     userID,
			IDExternal: "acctid",
			Calendars: []database.Calendar{
				{"owner", "calid", "", ""},
				{"reader", "other_calid", "", ""},
			},
		}, nil)
	assert.NoError(t, err)

	calendarEventCollection := database.GetCalendarEventCollection(db)
	timeOneHourLater := api.GetCurrentTime().Add(1 * time.Hour)
	timeOneDayLater := api.GetCurrentTime().Add(24 * time.Hour)

	t.Run("MissingTimezoneOffsetHeader", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/meeting_preparation_tasks/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, `{"error":"Timezone-Offset header is required"}`, string(body))
	})
	t.Run("NoEvents", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/meeting_preparation_tasks/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)
		request.Header.Set("Timezone-Offset", "0")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "[]", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		_, err = createTestEvent(calendarEventCollection, userID, "Event1", primitive.NewObjectID().Hex(), timeOneHourLater, timeOneDayLater, primitive.NilObjectID, "acctid", "calid")
		assert.NoError(t, err)
		request, _ := http.NewRequest("GET", "/meeting_preparation_tasks/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)
		request.Header.Set("Timezone-Offset", "0")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)

		expectedBody := `[{"id":"[a-z0-9]{24}","id_ordering":0,"id_folder":"000000000000000000000000","source":{"name":"Google Calendar","logo":"gcal"},"deeplink":"","title":"Event1","body":"","due_date":"","priority_normalized":0,"is_done":false,"is_deleted":false,"recurring_task_template_id":"000000000000000000000000","meeting_preparation_params":{"datetime_start":"(.*?)","datetime_end":"(.*?)","event_moved_or_deleted":false},"created_at":"(.*?)","updated_at":"(.*?)"}]`
		assert.Regexp(t, expectedBody, string(body))
		assert.NoError(t, err)
	})
}

func TestGetMeetingPreparationTasksResultV4(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	testTime := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)
	api.OverrideTime = &testTime

	authtoken := login("test_overview@generaltask.com", "")
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, db, authtoken)
	_, err = database.UpdateOrCreateCalendarAccount(db, userID, "123abc", "foobar_source",
		&database.CalendarAccount{
			UserID:     userID,
			IDExternal: "acctid",
			Calendars: []database.Calendar{
				{"owner", "calid", "", ""},
				{"reader", "other_calid", "", ""},
			},
		}, nil)
	assert.NoError(t, err)

	calendarEventCollection := database.GetCalendarEventCollection(db)
	timeOneHourEarlier := api.GetCurrentTime().Add(-1 * time.Hour)
	timeOneHourLater := api.GetCurrentTime().Add(1 * time.Hour)
	timeOneDayLater := api.GetCurrentTime().Add(24 * time.Hour)
	timeTwoHoursLater := api.GetCurrentTime().Add(2 * time.Hour)
	eventCollection := database.GetCalendarEventCollection(db)
	externalEventID := primitive.NewObjectID().Hex()

	t.Run("NoEvents", func(t *testing.T) {
		result, err := api.GetMeetingPreparationTasksResultV4(userID, 0)
		assert.NoError(t, err)
		assert.Equal(t, []*TaskResultV4{}, result)
	})
	t.Run("EventDifferentUser", func(t *testing.T) {
		_, err = createTestEvent(calendarEventCollection, primitive.NewObjectID(), "Event1", primitive.NewObjectID().Hex(), timeOneHourLater, timeOneDayLater, primitive.NilObjectID, "acctid", "calid")
		assert.NoError(t, err)
		result, err := api.GetMeetingPreparationTasksResultV4(userID, 0)
		assert.NoError(t, err)
		assert.Equal(t, []*TaskResultV4{}, result)
	})
	t.Run("EventEarlierToday", func(t *testing.T) {
		_, err = createTestEvent(calendarEventCollection, userID, "Event1", primitive.NewObjectID().Hex(), timeOneHourEarlier, timeOneDayLater, primitive.NilObjectID, "acctid", "calid")
		assert.NoError(t, err)
		result, err := api.GetMeetingPreparationTasksResultV4(userID, 0)
		assert.NoError(t, err)
		assert.Equal(t, []*TaskResultV4{}, result)
	})
	t.Run("EventTomorrow", func(t *testing.T) {
		_, err = createTestEvent(calendarEventCollection, userID, "Event1", primitive.NewObjectID().Hex(), timeOneDayLater, timeOneDayLater.Add(1*time.Hour), primitive.NilObjectID, "acctid", "calid")
		assert.NoError(t, err)
		result, err := api.GetMeetingPreparationTasksResultV4(userID, 0)
		assert.NoError(t, err)
		assert.Equal(t, []*TaskResultV4{}, result)
	})
	t.Run("EventLaterToday", func(t *testing.T) {
		_, err = createTestEvent(calendarEventCollection, userID, "Event1", externalEventID, timeOneHourLater, timeOneDayLater, primitive.NilObjectID, "acctid", "calid")
		assert.NoError(t, err)
		result, err := api.GetMeetingPreparationTasksResultV4(userID, 0)
		assert.NoError(t, err)
		assert.Len(t, result, 1)
		assert.Equal(t, "Event1", result[0].Title)
		assert.False(t, result[0].MeetingPreparationParams.EventMovedOrDeleted)
	})
	t.Run("EventMovedToLaterToday", func(t *testing.T) {
		_, err = eventCollection.UpdateOne(context.Background(), bson.M{"id_external": externalEventID}, bson.M{"$set": bson.M{"datetime_start": primitive.NewDateTimeFromTime(timeOneHourLater.Add(1 * time.Hour))}})
		assert.NoError(t, err)
		result, err := api.GetMeetingPreparationTasksResultV4(userID, 0)
		assert.NoError(t, err)
		assert.Len(t, result, 1)
		assert.Equal(t, "Event1", result[0].Title)
		assert.True(t, result[0].MeetingPreparationParams.EventMovedOrDeleted)
		assert.False(t, result[0].IsDone)
	})
	t.Run("MeetingPreparationTaskAlreadyExists", func(t *testing.T) {
		idExternal := primitive.NewObjectID().Hex()
		insertResult, err := createTestEvent(calendarEventCollection, userID, "Event2", idExternal, timeOneHourLater, timeOneDayLater, primitive.NilObjectID, "acctid", "calid")
		assert.NoError(t, err)

		taskCollection := database.GetTaskCollection(db)
		_, err = createTestMeetingPreparationTask(taskCollection, userID, "Event2", idExternal, false, timeTwoHoursLater, timeOneDayLater, insertResult.InsertedID.(primitive.ObjectID))
		assert.NoError(t, err)

		result, err := api.GetMeetingPreparationTasksResultV4(userID, 0)
		assert.NoError(t, err)
		assert.Len(t, result, 2)
		assert.Equal(t, "Event2", result[0].Title)
		assert.Equal(t, "Event1", result[1].Title)
	})
	t.Run("TaskWithMissingEvent", func(t *testing.T) {
		taskCollection := database.GetTaskCollection(db)
		_, err = createTestMeetingPreparationTask(taskCollection, userID, "Event3", "missing", false, timeTwoHoursLater, timeOneDayLater, primitive.NilObjectID)
		assert.NoError(t, err)

		result, err := api.GetMeetingPreparationTasksResultV4(userID, 0)
		assert.NoError(t, err)
		assert.Len(t, result, 3)
		assert.Equal(t, "Event2", result[0].Title)
		assert.Equal(t, "Event3", result[1].Title)
		assert.True(t, result[1].MeetingPreparationParams.EventMovedOrDeleted)
		assert.Equal(t, "Event1", result[2].Title)
	})
}
