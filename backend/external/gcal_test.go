package external

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/googleapi"
)

func TestCalendar(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		standardEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "Standard Event",
			Start:          &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:            &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:       "generaltask.io",
			Id:             "standard_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		startTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:00:00-05:00")
		endTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:30:00-05:00")

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		userID := primitive.NewObjectID()
		standardTask := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering:    0,
				IDExternal:    "standard_event",
				IDTaskSection: constants.IDTaskSectionToday,
				Deeplink:      "generaltask.io",
				Title:         "Standard Event",
				SourceID:      TASK_SOURCE_ID_GCAL,
				UserID:        userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(startTime),
			DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
		}

		autoEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "Auto Event (via Clockwise)",
			Start:          &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:            &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:       "generaltask.io",
			Id:             "auto_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		allDayEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "All day Event",
			Start:          &calendar.EventDateTime{Date: "2021-03-06"},
			End:            &calendar.EventDateTime{Date: "2021-03-06"},
			HtmlLink:       "generaltask.io",
			Id:             "all_day_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		server := getServerForTasks([]*calendar.Event{&standardEvent, &allDayEvent, &autoEvent})
		defer server.Close()

		var calendarResult = make(chan CalendarResult)
		googleCalendar := GoogleCalendarSource{
			Google: GoogleService{
				OverrideURLs: GoogleURLOverrides{CalendarFetchURL: &server.URL},
			},
		}
		go googleCalendar.GetEvents(userID, "exampleAccountID", 0, calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.CalendarEvents))
		firstTask := result.CalendarEvents[0]
		assertCalendarEventsEqual(t, &standardTask, firstTask)

		taskCollection := db.Collection("tasks")

		var calendarEventFromDB database.CalendarEvent
		err = taskCollection.FindOne(
			context.TODO(),
			bson.M{"$and": []bson.M{
				{"id_external": "standard_event"},
				{"source.name": TaskSourceGoogleCalendar.Name},
				{"user_id": userID},
			}},
		).Decode(&calendarEventFromDB)
		assert.NoError(t, err)
		assertCalendarEventsEqual(t, &standardTask, &calendarEventFromDB)
		assert.Equal(t, "exampleAccountID", calendarEventFromDB.SourceAccountID)
	})
	t.Run("ExistingEvent", func(t *testing.T) {
		standardEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "Standard Event",
			Start:          &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:            &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:       "generaltask.io",
			Id:             "standard_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		startTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:00:00-05:00")
		oldEndtime, _ := time.Parse(time.RFC3339, "2021-03-06T15:35:00-05:00")
		endTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:30:00-05:00")

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		userID := primitive.NewObjectID()
		standardTask := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering:      1,
				IDExternal:      "standard_event",
				IDTaskSection:   constants.IDTaskSectionToday,
				Deeplink:        "generaltask.io",
				Title:           "Standard Event",
				SourceID:        TASK_SOURCE_ID_GCAL,
				UserID:          userID,
				SourceAccountID: "exampleAccountID",
			},
			DatetimeStart: primitive.NewDateTimeFromTime(startTime),
			DatetimeEnd:   primitive.NewDateTimeFromTime(oldEndtime),
		}
		database.GetOrCreateTask(db, userID, "standard_event", TASK_SOURCE_ID_GCAL, standardTask)
		// Rescheduling end time along shouldn't trigger a reset like in the next test case
		standardTask.DatetimeEnd = primitive.NewDateTimeFromTime(endTime)

		autoEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "Auto Event (via Clockwise)",
			Start:          &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:            &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:       "generaltask.io",
			Id:             "auto_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		allDayEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "All day Event",
			Start:          &calendar.EventDateTime{Date: "2021-03-06"},
			End:            &calendar.EventDateTime{Date: "2021-03-06"},
			HtmlLink:       "generaltask.io",
			Id:             "all_day_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		server := getServerForTasks([]*calendar.Event{&standardEvent, &allDayEvent, &autoEvent})
		defer server.Close()

		var calendarResult = make(chan CalendarResult)
		googleCalendar := GoogleCalendarSource{
			Google: GoogleService{
				OverrideURLs: GoogleURLOverrides{CalendarFetchURL: &server.URL},
			},
		}
		go googleCalendar.GetEvents(userID, "exampleAccountID", 0, calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.CalendarEvents))
		firstTask := result.CalendarEvents[0]
		assertCalendarEventsEqual(t, &standardTask, firstTask)

		taskCollection := db.Collection("tasks")

		var calendarEventFromDB database.CalendarEvent
		err = taskCollection.FindOne(
			context.TODO(),
			bson.M{"$and": []bson.M{
				{"id_external": "standard_event"},
				{"source.name": TaskSourceGoogleCalendar.Name},
				{"user_id": userID},
			}},
		).Decode(&calendarEventFromDB)
		assert.NoError(t, err)
		assertCalendarEventsEqual(t, &standardTask, &calendarEventFromDB)
		assert.Equal(t, "exampleAccountID", calendarEventFromDB.SourceAccountID)
	})
	t.Run("RescheduledEvent", func(t *testing.T) {
		standardEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "Standard Event",
			Start:          &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:            &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:       "generaltask.io",
			Id:             "standard_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		// Start time in DB is different to simulate rescheduling a meeting
		oldStartTime, _ := time.Parse(time.RFC3339, "2021-03-06T13:00:00-05:00")
		startTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:00:00-05:00")
		endTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:30:00-05:00")

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		userID := primitive.NewObjectID()
		standardTask := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering:      1,
				IDExternal:      "standard_event",
				IDTaskSection:   constants.IDTaskSectionToday,
				Deeplink:        "generaltask.io",
				Title:           "Standard Event",
				SourceID:        TASK_SOURCE_ID_GCAL,
				UserID:          userID,
				SourceAccountID: "exampleAccountID",
			},
			DatetimeStart: primitive.NewDateTimeFromTime(oldStartTime),
			DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
		}
		database.GetOrCreateTask(db, userID, "standard_event", TASK_SOURCE_ID_GCAL, standardTask)
		standardTask.DatetimeStart = primitive.NewDateTimeFromTime(startTime)
		// IDOrdering expected to be zero because ordering is reset upon rescheduling
		standardTask.IDOrdering = 0

		server := getServerForTasks([]*calendar.Event{&standardEvent})
		defer server.Close()

		var calendarResult = make(chan CalendarResult)
		googleCalendar := GoogleCalendarSource{
			Google: GoogleService{
				OverrideURLs: GoogleURLOverrides{CalendarFetchURL: &server.URL},
			},
		}
		go googleCalendar.GetEvents(userID, "exampleAccountID", 0, calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.CalendarEvents))
		firstTask := result.CalendarEvents[0]
		assertCalendarEventsEqual(t, &standardTask, firstTask)

		taskCollection := db.Collection("tasks")

		var calendarEventFromDB database.CalendarEvent
		err = taskCollection.FindOne(
			context.TODO(),
			bson.M{"$and": []bson.M{
				{"id_external": "standard_event"},
				{"source.name": TaskSourceGoogleCalendar.Name},
				{"user_id": userID},
			}},
		).Decode(&calendarEventFromDB)
		assert.NoError(t, err)
		// DB is not updated until task merge
		standardTask.IDOrdering = 1
		assertCalendarEventsEqual(t, &standardTask, &calendarEventFromDB)
		assert.Equal(t, "exampleAccountID", calendarEventFromDB.SourceAccountID)
	})
	t.Run("EmptyResult", func(t *testing.T) {
		server := getServerForTasks([]*calendar.Event{})
		googleCalendar := GoogleCalendarSource{
			Google: GoogleService{
				OverrideURLs: GoogleURLOverrides{CalendarFetchURL: &server.URL},
			},
		}
		defer server.Close()
		var calendarResult = make(chan CalendarResult)
		go googleCalendar.GetEvents(primitive.NewObjectID(), "exampleAccountID", 0, calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 0, len(result.CalendarEvents))
	})
}

func assertCalendarEventsEqual(t *testing.T, a *database.CalendarEvent, b *database.CalendarEvent) {
	assert.Equal(t, a.DatetimeStart, b.DatetimeStart)
	assert.Equal(t, a.DatetimeEnd, b.DatetimeEnd)
	assert.Equal(t, a.Deeplink, b.Deeplink)
	assert.Equal(t, a.IDExternal, b.IDExternal)
	assert.Equal(t, a.IDOrdering, b.IDOrdering)
	assert.Equal(t, a.IDTaskSection, b.IDTaskSection)
	assert.Equal(t, a.Title, b.Title)
	assert.Equal(t, a.SourceID, b.SourceID)
}

func getServerForTasks(events []*calendar.Event) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := &calendar.Events{
			Items:          events,
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 200},
		}

		b, err := json.Marshal(resp)
		if err != nil {
			http.Error(w, "unable to marshal request: "+err.Error(), http.StatusBadRequest)
			return
		}
		w.Write(b)
	}))
}
