package external

import (
	"context"
	"encoding/json"
	"github.com/GeneralTask/task-manager/backend/testutils"
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
	parentCtx := context.Background()
	t.Run("Success", func(t *testing.T) {
		standardEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "Standard Event",
			Description:    "event <strong>description</strong>",
			Start:          &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:            &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:       "generaltask.com",
			Id:             "standard_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		startTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:00:00-05:00")
		endTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:30:00-05:00")

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		userID := primitive.NewObjectID()
		standardTask := database.Item{
			TaskBase: database.TaskBase{
				IDOrdering:    0,
				IDExternal:    "standard_event",
				IDTaskSection: constants.IDTaskSectionToday,
				Deeplink:      "generaltask.com&authuser=exampleAccountID",
				Title:         "Standard Event",
				Body:          "event <strong>description</strong>",
				SourceID:      TASK_SOURCE_ID_GCAL,
				UserID:        userID,
			},
			CalendarEvent: database.CalendarEvent{
				DatetimeStart: primitive.NewDateTimeFromTime(startTime),
				DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
			},
			TaskType: database.TaskType{
				IsEvent: true,
			},
		}

		autoEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "Auto Event (via Clockwise)",
			Start:          &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:            &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:       "generaltask.com",
			Id:             "auto_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		allDayEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "All day Event",
			Start:          &calendar.EventDateTime{Date: "2021-03-06"},
			End:            &calendar.EventDateTime{Date: "2021-03-06"},
			HtmlLink:       "generaltask.com",
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
		go googleCalendar.GetEvents(userID, "exampleAccountID", time.Now(), time.Now(), calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.CalendarEvents))
		firstTask := result.CalendarEvents[0]
		assertCalendarEventsEqual(t, &standardTask, firstTask)

		taskCollection := database.GetTaskCollection(db)

		var calendarEventFromDB database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"id_external": "standard_event"},
				{"source_id": TASK_SOURCE_ID_GCAL},
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
			Description:    "new description",
			Start:          &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:            &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:       "generaltask.com",
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
		standardTask := database.Item{
			TaskBase: database.TaskBase{
				IDOrdering:      1,
				IDExternal:      "standard_event",
				IDTaskSection:   constants.IDTaskSectionToday,
				Deeplink:        "generaltask.com&authuser=exampleAccountID",
				Title:           "Standard Event",
				Body:            "old description",
				SourceID:        TASK_SOURCE_ID_GCAL,
				UserID:          userID,
				SourceAccountID: "exampleAccountID",
			},
			CalendarEvent: database.CalendarEvent{
				DatetimeStart: primitive.NewDateTimeFromTime(startTime),
				DatetimeEnd:   primitive.NewDateTimeFromTime(oldEndtime),
			},
			TaskType: database.TaskType{
				IsEvent: true,
			},
		}
		database.GetOrCreateTask(db, userID, "standard_event", TASK_SOURCE_ID_GCAL, standardTask)
		// Rescheduling end time along shouldn't trigger a reset like in the next test case
		standardTask.DatetimeEnd = primitive.NewDateTimeFromTime(endTime)
		standardTask.Body = "new description"

		autoEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "Auto Event (via Clockwise)",
			Start:          &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:            &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:       "generaltask.com",
			Id:             "auto_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		allDayEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "All day Event",
			Start:          &calendar.EventDateTime{Date: "2021-03-06"},
			End:            &calendar.EventDateTime{Date: "2021-03-06"},
			HtmlLink:       "generaltask.com",
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
		go googleCalendar.GetEvents(userID, "exampleAccountID", time.Now(), time.Now(), calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.CalendarEvents))
		firstTask := result.CalendarEvents[0]
		assertCalendarEventsEqual(t, &standardTask, firstTask)

		taskCollection := database.GetTaskCollection(db)

		var calendarEventFromDB database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"id_external": "standard_event"},
				{"source_id": TASK_SOURCE_ID_GCAL},
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
			HtmlLink:       "generaltask.com",
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
		standardTask := database.Item{
			TaskBase: database.TaskBase{
				IDOrdering:      1,
				IDExternal:      "standard_event",
				IDTaskSection:   constants.IDTaskSectionToday,
				Deeplink:        "generaltask.com&authuser=exampleAccountID",
				Title:           "Standard Event",
				SourceID:        TASK_SOURCE_ID_GCAL,
				UserID:          userID,
				SourceAccountID: "exampleAccountID",
			},
			CalendarEvent: database.CalendarEvent{
				DatetimeStart: primitive.NewDateTimeFromTime(oldStartTime),
				DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
			},
			TaskType: database.TaskType{
				IsEvent: true,
			},
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
		go googleCalendar.GetEvents(userID, "exampleAccountID", time.Now(), time.Now(), calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.CalendarEvents))
		firstTask := result.CalendarEvents[0]
		assertCalendarEventsEqual(t, &standardTask, firstTask)

		taskCollection := database.GetTaskCollection(db)

		var calendarEventFromDB database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"id_external": "standard_event"},
				{"source_id": TASK_SOURCE_ID_GCAL},
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
		go googleCalendar.GetEvents(primitive.NewObjectID(), "exampleAccountID", time.Now(), time.Now(), calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 0, len(result.CalendarEvents))
	})
	t.Run("Conference event", func(t *testing.T) {
		standardEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "Standard Event",
			Start:          &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:            &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:       "generaltask.com",
			Id:             "standard_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
			ConferenceData: &calendar.ConferenceData{
				EntryPoints: []*calendar.EntryPoint{
					{
						Uri: "https://meet.google.com/example-conference-id",
					},
				},
				ConferenceSolution: &calendar.ConferenceSolution{
					Name:    "sample-platform",
					IconUri: "sample-icon-uri",
				},
			},
		}

		startTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:00:00-05:00")
		endTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:30:00-05:00")

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		userID := primitive.NewObjectID()
		standardTask := database.Item{
			TaskBase: database.TaskBase{
				IDOrdering:    0,
				IDExternal:    "standard_event",
				IDTaskSection: constants.IDTaskSectionToday,
				Deeplink:      "generaltask.com&authuser=exampleAccountID",
				Title:         "Standard Event",
				SourceID:      TASK_SOURCE_ID_GCAL,
				UserID:        userID,
				ConferenceCall: &database.ConferenceCall{
					URL:      "https://meet.google.com/example-conference-id?authuser=exampleAccountID",
					Platform: "sample-platform",
					Logo:     "sample-icon-uri",
				},
			},
			CalendarEvent: database.CalendarEvent{
				DatetimeStart: primitive.NewDateTimeFromTime(startTime),
				DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
			},
			TaskType: database.TaskType{
				IsEvent: true,
			},
		}

		autoEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "Auto Event (via Clockwise)",
			Start:          &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:            &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:       "generaltask.com",
			Id:             "auto_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		allDayEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "All day Event",
			Start:          &calendar.EventDateTime{Date: "2021-03-06"},
			End:            &calendar.EventDateTime{Date: "2021-03-06"},
			HtmlLink:       "generaltask.com",
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
		go googleCalendar.GetEvents(userID, "exampleAccountID", time.Now(), time.Now(), calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.CalendarEvents))
		firstTask := result.CalendarEvents[0]
		assertCalendarEventsEqual(t, &standardTask, firstTask)

		taskCollection := database.GetTaskCollection(db)

		var calendarEventFromDB database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"id_external": "standard_event"},
				{"source_id": TASK_SOURCE_ID_GCAL},
				{"user_id": userID},
			}},
		).Decode(&calendarEventFromDB)
		assert.NoError(t, err)
		assertCalendarEventsEqual(t, &standardTask, &calendarEventFromDB)
		assert.Equal(t, "exampleAccountID", calendarEventFromDB.SourceAccountID)
	})
}

func TestCreateNewEvent(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		userID := primitive.NewObjectID()

		eventCreateObj := EventCreateObject{
			AccountID:     "test_account_id",
			Summary:       "test summary",
			Location:      "test location",
			Description:   "test description",
			TimeZone:      "test timezone",
			DatetimeStart: testutils.CreateTimestamp("2019-04-20"),
			DatetimeEnd:   testutils.CreateTimestamp("2020-04-20"),
			Attendees:     []Attendee{{Name: "test attendee", Email: "test_attendee@generaltask.com"}},
			AddHangouts:   true,
		}
		expectedRequestEvent := calendar.Event{
			Attendees: []*calendar.EventAttendee{{
				DisplayName: "test attendee",
				Email:       "test_attendee@generaltask.com",
			}},
			Description: "test description",
			Start:       &calendar.EventDateTime{Date: "", DateTime: "2019-04-20T00:00:00Z", TimeZone: "test timezone"},
			End:         &calendar.EventDateTime{Date: "", DateTime: "2020-04-20T00:00:00Z", TimeZone: "test timezone"},
			Location:    "test location",
			Summary:     "test summary",
		}

		server := getEventCreateServer(t, eventCreateObj, &expectedRequestEvent)
		defer server.Close()

		googleCalendar := GoogleCalendarSource{
			Google: GoogleService{
				OverrideURLs: GoogleURLOverrides{CalendarFetchURL: &server.URL},
			},
		}
		googleCalendar.CreateNewEvent(userID, "exampleAccountID", eventCreateObj)
	})
}

func assertCalendarEventsEqual(t *testing.T, a *database.Item, b *database.Item) {
	assert.Equal(t, a.TaskType, b.TaskType)
	assert.Equal(t, a.DatetimeStart, b.DatetimeStart)
	assert.Equal(t, a.DatetimeEnd, b.DatetimeEnd)
	assert.Equal(t, a.Deeplink, b.Deeplink)
	assert.Equal(t, a.IDExternal, b.IDExternal)
	assert.Equal(t, a.IDOrdering, b.IDOrdering)
	assert.Equal(t, a.IDTaskSection, b.IDTaskSection)
	assert.Equal(t, a.Title, b.Title)
	assert.Equal(t, a.SourceID, b.SourceID)
	assert.Equal(t, a.ConferenceCall, b.ConferenceCall)
}

func assertGcalCalendarEventsEqual(t *testing.T, a *calendar.Event, b *calendar.Event) {
	assert.Equal(t, a.Description, b.Description)
	assert.Equal(t, a.Location, b.Location)
	assert.Equal(t, a.Summary, b.Summary)
	assert.Equal(t, a.Start.DateTime, b.Start.DateTime)
	assert.Equal(t, a.Start.TimeZone, b.Start.TimeZone)
	assert.Equal(t, a.End.DateTime, b.End.DateTime)
	assert.Equal(t, a.End.TimeZone, b.End.TimeZone)
	assert.Equal(t, len(a.Attendees), len(b.Attendees))
	if len(a.Attendees) == len(b.Attendees) {
		for i, _ := range a.Attendees {
			assert.Equal(t, a.Attendees[i].Email, b.Attendees[i].Email)
			assert.Equal(t, a.Attendees[i].DisplayName, b.Attendees[i].DisplayName)
		}
	}
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

func getEventCreateServer(t *testing.T, eventCreateObj EventCreateObject, expectedEvent *calendar.Event) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var requestEvent calendar.Event
		json.NewDecoder(r.Body).Decode(&requestEvent)

		assertGcalCalendarEventsEqual(t, expectedEvent, &requestEvent)
		if eventCreateObj.AddHangouts {
			assert.NotNil(t, requestEvent.ConferenceData)
			assert.Equal(t, requestEvent.ConferenceData.CreateRequest.ConferenceSolutionKey.Type, "hangoutsMeet")
		}

		w.WriteHeader(201)
		w.Write([]byte(`{}`))
		return
	}))
}
