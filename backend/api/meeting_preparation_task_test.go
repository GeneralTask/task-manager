package api

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestMeetingPreparationTask(t *testing.T) {
	authtoken := login("test_meeting_prep_endpoint@generaltask.com", "")
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
				{
					AccessRole: constants.AccessControlOwner,
					CalendarID: "calid",
				},
				{
					AccessRole: constants.AccessControlReader,
					CalendarID: "other_calid",
				},
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

func TestGetMeetingPreparationTasksResult(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	testTime := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)
	api.OverrideTime = &testTime

	authtoken := login("test_get_meeting_prep_v4@generaltask.com", "")
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, db, authtoken)
	_, err = database.UpdateOrCreateCalendarAccount(db, userID, "123abc", "foobar_source",
		&database.CalendarAccount{
			UserID:     userID,
			IDExternal: "acctid",
			Calendars: []database.Calendar{
				{
					AccessRole: constants.AccessControlOwner,
					CalendarID: "calid",
				},
				{
					AccessRole: constants.AccessControlReader,
					CalendarID: "other_calid",
				},
			},
		}, nil)
	assert.NoError(t, err)

	calendarEventCollection := database.GetCalendarEventCollection(db)
	timeOneHourEarlier := api.GetCurrentTime().Add(-1 * time.Hour)
	timeOneHourLater := api.GetCurrentTime().Add(1 * time.Hour)
	timeOneHourAgo := api.GetCurrentTime().Add(-1 * time.Hour)
	timeOneDayLater := api.GetCurrentTime().Add(24 * time.Hour)
	timeTwoHoursLater := api.GetCurrentTime().Add(2 * time.Hour)
	timeZero := time.Date(0, 0, 0, 0, 0, 0, 0, time.UTC)

	taskCollection := database.GetTaskCollection(db)
	eventCollection := database.GetCalendarEventCollection(db)
	externalEventID := primitive.NewObjectID().Hex()

	t.Run("NoEvents", func(t *testing.T) {
		result, err := api.GetMeetingPreparationTasksResult(userID, 0)
		assert.NoError(t, err)
		assert.Equal(t, []*TaskResultV4{}, result)
	})
	t.Run("EventDifferentUser", func(t *testing.T) {
		_, err = createTestEvent(calendarEventCollection, primitive.NewObjectID(), "Event1", primitive.NewObjectID().Hex(), timeOneHourLater, timeOneDayLater, primitive.NilObjectID, "acctid", "calid")
		assert.NoError(t, err)
		result, err := api.GetMeetingPreparationTasksResult(userID, 0)
		assert.NoError(t, err)
		assert.Equal(t, []*TaskResultV4{}, result)
	})
	t.Run("EventEarlierToday", func(t *testing.T) {
		_, err = createTestEvent(calendarEventCollection, userID, "Event1", primitive.NewObjectID().Hex(), timeOneHourEarlier, timeOneDayLater, primitive.NilObjectID, "acctid", "calid")
		assert.NoError(t, err)
		result, err := api.GetMeetingPreparationTasksResult(userID, 0)
		assert.NoError(t, err)
		assert.Equal(t, []*TaskResultV4{}, result)
	})
	t.Run("EventTomorrow", func(t *testing.T) {
		_, err = createTestEvent(calendarEventCollection, userID, "Event1", primitive.NewObjectID().Hex(), timeOneDayLater, timeOneDayLater.Add(1*time.Hour), primitive.NilObjectID, "acctid", "calid")
		assert.NoError(t, err)
		result, err := api.GetMeetingPreparationTasksResult(userID, 0)
		assert.NoError(t, err)
		assert.Equal(t, []*TaskResultV4{}, result)
	})
	t.Run("EventLaterToday", func(t *testing.T) {
		_, err = createTestEvent(calendarEventCollection, userID, "Event1", externalEventID, timeOneHourLater, timeOneDayLater, primitive.NilObjectID, "acctid", "calid")
		assert.NoError(t, err)
		result, err := api.GetMeetingPreparationTasksResult(userID, 0)
		assert.NoError(t, err)
		assert.Len(t, result, 1)
		assert.Equal(t, "Event1", result[0].Title)
		assert.False(t, result[0].MeetingPreparationParams.EventMovedOrDeleted)
	})
	t.Run("EventMovedToLaterToday", func(t *testing.T) {
		_, err = eventCollection.UpdateOne(context.Background(), bson.M{"id_external": externalEventID}, bson.M{"$set": bson.M{"datetime_start": primitive.NewDateTimeFromTime(timeOneHourLater.Add(1 * time.Hour))}})
		assert.NoError(t, err)
		result, err := api.GetMeetingPreparationTasksResult(userID, 0)
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

		_, err = createTestMeetingPreparationTask(taskCollection, userID, "Event2", idExternal, false, timeTwoHoursLater, timeOneDayLater, insertResult.InsertedID.(primitive.ObjectID))
		assert.NoError(t, err)

		result, err := api.GetMeetingPreparationTasksResult(userID, 0)
		assert.NoError(t, err)
		assert.Len(t, result, 2)
		assert.Equal(t, "Event1", result[0].Title)
		assert.Equal(t, "Event2", result[1].Title)
	})
	t.Run("TaskWithMissingEvent", func(t *testing.T) {
		_, err = createTestMeetingPreparationTask(taskCollection, userID, "Event3", "missing", false, timeTwoHoursLater, timeOneDayLater, primitive.NilObjectID)
		assert.NoError(t, err)

		result, err := api.GetMeetingPreparationTasksResult(userID, 0)
		assert.NoError(t, err)
		assert.Len(t, result, 3)
		assert.Equal(t, "Event1", result[0].Title)
		assert.Equal(t, "Event3", result[1].Title)
		assert.True(t, result[1].MeetingPreparationParams.EventMovedOrDeleted)
		assert.Equal(t, "Event2", result[2].Title)
	})
	t.Run("EventIsNotOnOwnedCalendar", func(t *testing.T) {
		_, err = createTestEvent(calendarEventCollection, userID, "Event4", primitive.NewObjectID().Hex(), timeOneHourLater, timeOneDayLater, primitive.NilObjectID, "acctid", "other_calid")
		assert.NoError(t, err)
		result, err := api.GetMeetingPreparationTasksResult(userID, 0)
		assert.NoError(t, err)
		assert.Len(t, result, 3)
		assert.Equal(t, "Event1", result[0].Title)
		assert.Equal(t, "Event3", result[1].Title)
		assert.Equal(t, "Event2", result[2].Title)
	})
	t.Run("MeetingHasEnded", func(t *testing.T) {
		idExternal := primitive.NewObjectID().Hex()

		_, err := createTestEvent(calendarEventCollection, userID, "Event5", idExternal, timeOneHourAgo, timeOneHourAgo, primitive.NilObjectID, "acctid", "calid")
		assert.NoError(t, err)

		insertResult, err := createTestMeetingPreparationTask(taskCollection, userID, "reticulate splines", idExternal, false, timeZero, timeZero, primitive.NilObjectID)
		assert.NoError(t, err)

		res, err := api.GetMeetingPreparationTasksResult(userID, 0)
		assert.NoError(t, err)

		var item database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertResult.InsertedID.(primitive.ObjectID)}).Decode(&item)
		assert.NoError(t, err)
		assert.Equal(t, true, *item.IsCompleted)
		assert.NotEqual(t, primitive.DateTime(0), item.CompletedAt)
		assert.Equal(t, true, item.MeetingPreparationParams.HasBeenAutomaticallyCompleted)

		assert.Equal(t, "Event1", res[0].Title)
		assert.Equal(t, "Event3", res[1].Title)
		assert.Equal(t, "Event2", res[2].Title)
		assert.True(t, res[3].IsDone)
		assert.Len(t, res, 4)
		assert.Equal(t, "reticulate splines", res[3].Title)
	})
	t.Run("EventMovedToNextDay", func(t *testing.T) {
		idExternal := primitive.NewObjectID().Hex()

		insertResult, err := createTestEvent(calendarEventCollection, userID, "Event6", idExternal, timeTwoHoursLater, timeOneDayLater, primitive.NilObjectID, "acctid", "calid")
		assert.NoError(t, err)

		insertTaskResult, err := createTestMeetingPreparationTask(taskCollection, userID, "Event6", idExternal, false, timeTwoHoursLater, timeOneDayLater, insertResult.InsertedID.(primitive.ObjectID))
		assert.NoError(t, err)

		_, err = calendarEventCollection.UpdateOne(context.Background(), bson.M{"_id": insertResult.InsertedID.(primitive.ObjectID)}, bson.M{"$set": bson.M{"datetime_start": primitive.NewDateTimeFromTime(timeOneDayLater)}})
		assert.NoError(t, err)

		res, err := api.GetMeetingPreparationTasksResult(userID, 0)
		assert.NoError(t, err)

		var item database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertTaskResult.InsertedID.(primitive.ObjectID)}).Decode(&item)
		assert.NoError(t, err)
		assert.True(t, item.MeetingPreparationParams.EventMovedOrDeleted)

		assert.Len(t, res, 5)

		assert.Equal(t, "Event6", res[0].Title)
		assert.Equal(t, "Event1", res[1].Title)
		assert.Equal(t, "Event3", res[2].Title)
		assert.Equal(t, "Event2", res[3].Title)
		assert.Equal(t, "reticulate splines", res[4].Title)
		assert.True(t, res[4].IsDone)
	})
	t.Run("LimitResponseTo100Tasks", func(t *testing.T) {
		authtoken := login("test_limit_100_tasks@generaltask.com", "")
		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		userID := getUserIDFromAuthToken(t, db, authtoken)

		// Add 200 new meeting preparation tasks
		for i := 0; i < 200; i++ {
			eventTitle := fmt.Sprintf("Event%d", i)
			_, err = createTestMeetingPreparationTask(taskCollection, userID, eventTitle, primitive.NewObjectID().Hex(), false, timeOneHourEarlier, timeOneDayLater, primitive.NilObjectID)
			assert.NoError(t, err)
		}
		// Add a task that should be returned first in the response
		_, err = createTestMeetingPreparationTask(taskCollection, userID, "Should be first", primitive.NewObjectID().Hex(), false, timeOneHourLater, timeOneDayLater, primitive.NilObjectID)
		assert.NoError(t, err)

		//Check that only 100 tasks are returned
		res, err := api.GetMeetingPreparationTasksResult(userID, 0)
		assert.NoError(t, err)
		assert.Len(t, res, 100)
		// Check that the first task is the one we added
		assert.Equal(t, "Should be first", res[0].Title)
	})

}
