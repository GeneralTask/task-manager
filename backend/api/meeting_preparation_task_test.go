package api

import (
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

		expectedBody := `[{"id":"[a-z0-9]{24}","id_ordering":0,"source":{"name":"Google Calendar","logo":"/images/gcal.svg","logo_v2":"gcal","is_completable":true,"is_replyable":false},"deeplink":"","title":"Event1","body":"","sender":"","due_date":"","priority_normalized":0,"time_allocated":0,"sent_at":"(.*?)","is_done":false,"is_deleted":false,"is_meeting_preparation_task":true,"recurring_task_template_id":"000000000000000000000000","meeting_preparation_params":{"datetime_start":"(.*?)","datetime_end":"(.*?)","event_moved_or_deleted":false},"created_at":"(.*?)","updated_at":"(.*?)"}]`
		assert.Regexp(t, expectedBody, string(body))
		assert.NoError(t, err)
	})
}
