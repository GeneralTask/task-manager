package api

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
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

	_, err = createTestEvent(calendarEventCollection, userID, "Event1", primitive.NewObjectID().Hex(), timeOneHourLater, timeOneDayLater, primitive.NilObjectID, "acctid", "calid")
	assert.NoError(t, err)

	t.Run("Success", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/meeting_preparation_tasks/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)
		request.Header.Set("Timezone-Offset", "0")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		expectedBody := fmt.Sprintf(`[{"ID":"[a-z0-9]{24}","UserID":"%s","ParentTaskID":"000000000000000000000000","RecurringTaskTemplateID":"000000000000000000000000","IDExternal":"","IDOrdering":0,"IDTaskSection":"000000000000000000000000","IsCompleted":false,"IsDeleted":false,"Sender":"","SourceID":"gcal","SourceAccountID":"","Deeplink":"","Title":"Event1","Body":null,"HasBeenReordered":false,"DueDate":null,"TimeAllocation":null,"CreatedAtExternal":"(.*?)","UpdatedAt":"(.*?)","CompletedAt":"1969-12-31T19:00:00-05:00","DeletedAt":"1969-12-31T19:00:00-05:00","PriorityNormalized":null,"TaskNumber":null,"Comments":null,"ExternalPriority":null,"AllExternalPriorities":null,"NUXNumber":0,"Status":null,"PreviousStatus":null,"CompletedStatus":null,"AllStatuses":null,"SlackMessageParams":null,"JIRATaskParams":null,"MeetingPreparationParams":{"CalendarEventID":"[a-z0-9]{24}","IDExternal":"[a-z0-9]{24}","DatetimeStart":"2021-12-31T20:00:00-05:00","DatetimeEnd":"2022-01-01T19:00:00-05:00","HasBeenAutomaticallyCompleted":false,"EventMovedOrDeleted":false},"IsMeetingPreparationTask":true}]`, userID.Hex())
		assert.Regexp(t, expectedBody, string(body))
		assert.NoError(t, err)
	})
}
