package external

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/testutils"

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
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	t.Run("Success", func(t *testing.T) {
		standardEvent := calendar.Event{
			Created:         "2021-02-25T17:53:01.000Z",
			Summary:         "Standard Event",
			Description:     "event <strong>description</strong>",
			Start:           &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:             &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:        "generaltask.com",
			Id:              "standard_event",
			GuestsCanModify: false,
			Organizer:       &calendar.EventOrganizer{Self: true},
			ServerResponse:  googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		startTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:00:00-05:00")
		endTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:30:00-05:00")

		userID := primitive.NewObjectID()
		standardDBEvent := database.CalendarEvent{
			IDExternal:    "standard_event",
			Deeplink:      "generaltask.com&authuser=exampleAccountID",
			Title:         "Standard Event",
			Body:          "event <strong>description</strong>",
			SourceID:      TASK_SOURCE_ID_GCAL,
			UserID:        userID,
			CanModify:     true,
			DatetimeStart: primitive.NewDateTimeFromTime(startTime),
			DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
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
		go googleCalendar.GetEvents(db, userID, "exampleAccountID", time.Now(), time.Now(), calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.CalendarEvents))
		firstTask := result.CalendarEvents[0]
		assertCalendarEventsEqual(t, &standardDBEvent, firstTask)

		eventCollection := database.GetCalendarEventCollection(db)

		var calendarEventFromDB database.CalendarEvent
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = eventCollection.FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"id_external": "standard_event"},
				{"source_id": TASK_SOURCE_ID_GCAL},
				{"user_id": userID},
			}},
		).Decode(&calendarEventFromDB)
		assert.NoError(t, err)
		assertCalendarEventsEqual(t, &standardDBEvent, &calendarEventFromDB)
		assert.Equal(t, "exampleAccountID", calendarEventFromDB.SourceAccountID)
	})
	t.Run("ExistingEvent", func(t *testing.T) {
		standardEvent := calendar.Event{
			Created:         "2021-02-25T17:53:01.000Z",
			Summary:         "Standard Event",
			Description:     "new description",
			Start:           &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:             &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:        "generaltask.com",
			Id:              "standard_event",
			GuestsCanModify: false,
			Organizer:       &calendar.EventOrganizer{Self: false},
			ServerResponse:  googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		startTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:00:00-05:00")
		oldEndtime, _ := time.Parse(time.RFC3339, "2021-03-06T15:35:00-05:00")
		endTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:30:00-05:00")

		userID := primitive.NewObjectID()
		standardDBEvent := database.CalendarEvent{
			IDExternal:      "standard_event",
			Deeplink:        "generaltask.com&authuser=exampleAccountID",
			Title:           "Standard Event",
			Body:            "old description",
			SourceID:        TASK_SOURCE_ID_GCAL,
			UserID:          userID,
			SourceAccountID: "exampleAccountID",
			CanModify:       false,
			DatetimeStart:   primitive.NewDateTimeFromTime(startTime),
			DatetimeEnd:     primitive.NewDateTimeFromTime(oldEndtime),
		}
		database.GetOrCreateCalendarEvent(db, userID, "standard_event", TASK_SOURCE_ID_GCAL, standardDBEvent)
		// Rescheduling end time along shouldn't trigger a reset like in the next test case
		standardDBEvent.DatetimeEnd = primitive.NewDateTimeFromTime(endTime)
		standardDBEvent.Body = "new description"

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
		go googleCalendar.GetEvents(db, userID, "exampleAccountID", time.Now(), time.Now(), calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.CalendarEvents))
		firstTask := result.CalendarEvents[0]
		assertCalendarEventsEqual(t, &standardDBEvent, firstTask)

		eventCollection := database.GetCalendarEventCollection(db)

		var calendarEventFromDB database.CalendarEvent
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = eventCollection.FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"id_external": "standard_event"},
				{"source_id": TASK_SOURCE_ID_GCAL},
				{"user_id": userID},
			}},
		).Decode(&calendarEventFromDB)
		assert.NoError(t, err)
		assertCalendarEventsEqual(t, &standardDBEvent, &calendarEventFromDB)
		assert.Equal(t, "exampleAccountID", calendarEventFromDB.SourceAccountID)
	})
	t.Run("RescheduledEvent", func(t *testing.T) {
		standardEvent := calendar.Event{
			Created:         "2021-02-25T17:53:01.000Z",
			Summary:         "Standard Event",
			Start:           &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:             &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:        "generaltask.com",
			Id:              "standard_event",
			GuestsCanModify: true,
			Organizer:       &calendar.EventOrganizer{Self: false},
			ServerResponse:  googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		// Start time in DB is different to simulate rescheduling a meeting
		oldStartTime, _ := time.Parse(time.RFC3339, "2021-03-06T13:00:00-05:00")
		startTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:00:00-05:00")
		endTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:30:00-05:00")

		userID := primitive.NewObjectID()
		standardDBEvent := database.CalendarEvent{
			IDExternal:      "standard_event",
			Deeplink:        "generaltask.com&authuser=exampleAccountID",
			Title:           "Standard Event",
			SourceID:        TASK_SOURCE_ID_GCAL,
			UserID:          userID,
			SourceAccountID: "exampleAccountID",
			CanModify:       true,
			DatetimeStart:   primitive.NewDateTimeFromTime(oldStartTime),
			DatetimeEnd:     primitive.NewDateTimeFromTime(endTime),
		}
		database.GetOrCreateCalendarEvent(db, userID, "standard_event", TASK_SOURCE_ID_GCAL, standardDBEvent)
		standardDBEvent.DatetimeStart = primitive.NewDateTimeFromTime(startTime)

		server := getServerForTasks([]*calendar.Event{&standardEvent})
		defer server.Close()

		var calendarResult = make(chan CalendarResult)
		googleCalendar := GoogleCalendarSource{
			Google: GoogleService{
				OverrideURLs: GoogleURLOverrides{CalendarFetchURL: &server.URL},
			},
		}
		go googleCalendar.GetEvents(db, userID, "exampleAccountID", time.Now(), time.Now(), calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.CalendarEvents))
		firstTask := result.CalendarEvents[0]
		assertCalendarEventsEqual(t, &standardDBEvent, firstTask)

		eventCollection := database.GetCalendarEventCollection(db)

		var calendarEventFromDB database.CalendarEvent
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = eventCollection.FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"id_external": "standard_event"},
				{"source_id": TASK_SOURCE_ID_GCAL},
				{"user_id": userID},
			}},
		).Decode(&calendarEventFromDB)
		assert.NoError(t, err)

		assertCalendarEventsEqual(t, &standardDBEvent, &calendarEventFromDB)
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
		go googleCalendar.GetEvents(db, primitive.NewObjectID(), "exampleAccountID", time.Now(), time.Now(), calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 0, len(result.CalendarEvents))
	})
	t.Run("Conference event", func(t *testing.T) {
		standardEvent := calendar.Event{
			Created:         "2021-02-25T17:53:01.000Z",
			Summary:         "Standard Event",
			Start:           &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:             &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:        "generaltask.com",
			Id:              "standard_event",
			GuestsCanModify: true,
			Organizer:       &calendar.EventOrganizer{Self: true},
			ServerResponse:  googleapi.ServerResponse{HTTPStatusCode: 0},
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

		userID := primitive.NewObjectID()
		standardDBEvent := database.CalendarEvent{
			IDExternal:    "standard_event",
			Deeplink:      "generaltask.com&authuser=exampleAccountID",
			Title:         "Standard Event",
			SourceID:      TASK_SOURCE_ID_GCAL,
			UserID:        userID,
			CanModify:     true,
			CallURL:       "https://meet.google.com/example-conference-id?authuser=exampleAccountID",
			CallPlatform:  "sample-platform",
			CallLogo:      "sample-icon-uri",
			DatetimeStart: primitive.NewDateTimeFromTime(startTime),
			DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
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
		go googleCalendar.GetEvents(db, userID, "exampleAccountID", time.Now(), time.Now(), calendarResult)
		result := <-calendarResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.CalendarEvents))
		firstTask := result.CalendarEvents[0]
		assertCalendarEventsEqual(t, &standardDBEvent, firstTask)

		eventCollection := database.GetCalendarEventCollection(db)

		var calendarEventFromDB database.CalendarEvent
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = eventCollection.FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"id_external": "standard_event"},
				{"source_id": TASK_SOURCE_ID_GCAL},
				{"user_id": userID},
			}},
		).Decode(&calendarEventFromDB)
		assert.NoError(t, err)
		assertCalendarEventsEqual(t, &standardDBEvent, &calendarEventFromDB)
		assert.Equal(t, "exampleAccountID", calendarEventFromDB.SourceAccountID)
	})
}

func TestCreateNewEvent(t *testing.T) {
	db, dbCleanup, _ := database.GetDBConnection()
	defer dbCleanup()
	t.Run("ExternalError", func(t *testing.T) {
		userID := primitive.NewObjectID()

		eventCreateObj := EventCreateObject{
			AccountID:         "test_account_id",
			Summary:           "test summary",
			Location:          "test location",
			Description:       "test description",
			TimeZone:          "test timezone",
			DatetimeStart:     testutils.CreateTimestamp("2019-04-20"),
			DatetimeEnd:       testutils.CreateTimestamp("2020-04-20"),
			Attendees:         []Attendee{{Name: "test attendee", Email: "test_attendee@generaltask.com"}},
			AddConferenceCall: false,
		}

		server := getEventCreateServer(t, eventCreateObj, nil)
		defer server.Close()

		googleCalendar := GoogleCalendarSource{
			Google: GoogleService{
				OverrideURLs: GoogleURLOverrides{CalendarCreateURL: &server.URL},
			},
		}
		err := googleCalendar.CreateNewEvent(db, userID, "exampleAccountID", eventCreateObj)
		assert.Error(t, err)
	})
	t.Run("Success", func(t *testing.T) {
		userID := primitive.NewObjectID()

		eventCreateObj := EventCreateObject{
			AccountID:         "test_account_id",
			Summary:           "test summary",
			Location:          "test location",
			Description:       "test description",
			TimeZone:          "test timezone",
			DatetimeStart:     testutils.CreateTimestamp("2019-04-20"),
			DatetimeEnd:       testutils.CreateTimestamp("2020-04-20"),
			Attendees:         []Attendee{{Name: "test attendee", Email: "test_attendee@generaltask.com"}},
			AddConferenceCall: false,
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
				OverrideURLs: GoogleURLOverrides{CalendarCreateURL: &server.URL},
			},
		}
		err := googleCalendar.CreateNewEvent(db, userID, "exampleAccountID", eventCreateObj)
		assert.NoError(t, err)
	})
	t.Run("SuccessWithConferenceCall", func(t *testing.T) {
		userID := primitive.NewObjectID()

		eventCreateObj := EventCreateObject{
			AccountID:         "test_account_id",
			Summary:           "test summary",
			Location:          "test location",
			Description:       "test description",
			TimeZone:          "test timezone",
			DatetimeStart:     testutils.CreateTimestamp("2019-04-20"),
			DatetimeEnd:       testutils.CreateTimestamp("2020-04-20"),
			Attendees:         []Attendee{{Name: "test attendee", Email: "test_attendee@generaltask.com"}},
			AddConferenceCall: true,
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
			ConferenceData: &calendar.ConferenceData{
				CreateRequest: &calendar.CreateConferenceRequest{ConferenceSolutionKey: &calendar.ConferenceSolutionKey{Type: "hangoutsMeet"}},
			},
		}

		server := getEventCreateServer(t, eventCreateObj, &expectedRequestEvent)
		defer server.Close()

		googleCalendar := GoogleCalendarSource{
			Google: GoogleService{
				OverrideURLs: GoogleURLOverrides{CalendarCreateURL: &server.URL},
			},
		}
		err := googleCalendar.CreateNewEvent(db, userID, "exampleAccountID", eventCreateObj)
		assert.NoError(t, err)
	})
}

func TestDeleteEvent(t *testing.T) {
	db, dbCleanup, _ := database.GetDBConnection()
	defer dbCleanup()
	t.Run("ExternalError", func(t *testing.T) {
		userID := primitive.NewObjectID()
		gcalEventID := "event-id-1"

		server := getEventDeleteServer(t, "")
		defer server.Close()

		googleCalendar := GoogleCalendarSource{
			Google: GoogleService{
				OverrideURLs: GoogleURLOverrides{CalendarDeleteURL: &server.URL},
			},
		}
		err := googleCalendar.DeleteEvent(db, userID, "exampleAccountID", gcalEventID)
		assert.Error(t, err)
	})
	t.Run("Success", func(t *testing.T) {
		userID := primitive.NewObjectID()
		accountID := "exampleAccountID"
		gcalEventID := "event-id-2"

		server := getEventDeleteServer(t, fmt.Sprintf("/calendars/%s/events/%s?alt=json&prettyPrint=false", accountID, gcalEventID))
		defer server.Close()

		googleCalendar := GoogleCalendarSource{
			Google: GoogleService{
				OverrideURLs: GoogleURLOverrides{CalendarDeleteURL: &server.URL},
			},
		}
		err := googleCalendar.DeleteEvent(db, userID, accountID, gcalEventID)
		assert.NoError(t, err)
	})
}

func TestModifyEvent(t *testing.T) {
	db, dbCleanup, _ := database.GetDBConnection()
	defer dbCleanup()
	userID := primitive.NewObjectID()
	accountID := "duccount_id"
	eventID := "event_id"

	t.Run("SuccessWithSummaryAndDescription", func(t *testing.T) {
		summary := "test summary"
		description := "test description"
		eventModifyObj := EventModifyObject{
			AccountID:   accountID,
			Summary:     &summary,
			Description: &description,
		}
		expectedEvent := calendar.Event{
			Summary:     summary,
			Description: description,
		}
		googleCalendar, server := getEventModifyGoogleCalendar(t, &expectedEvent, accountID, eventID)
		defer server.Close()

		err := googleCalendar.ModifyEvent(db, userID, accountID, eventID, &eventModifyObj)
		assert.NoError(t, err)
	})
	t.Run("SuccessWithStartDate", func(t *testing.T) {
		datetimeStart := testutils.CreateTimestamp("2022-04-20")
		eventModifyObj := EventModifyObject{
			AccountID:     accountID,
			DatetimeStart: datetimeStart,
		}
		expectedEvent := calendar.Event{
			Start: &calendar.EventDateTime{Date: "", DateTime: "2022-04-20T00:00:00Z"},
		}
		googleCalendar, server := getEventModifyGoogleCalendar(t, &expectedEvent, accountID, eventID)
		defer server.Close()

		err := googleCalendar.ModifyEvent(db, userID, accountID, eventID, &eventModifyObj)
		assert.NoError(t, err)
	})
	t.Run("SuccessWithEndDate", func(t *testing.T) {
		datetimeEnd := testutils.CreateTimestamp("2023-04-20")
		eventModifyObj := EventModifyObject{
			AccountID:   accountID,
			DatetimeEnd: datetimeEnd,
		}
		expectedEvent := calendar.Event{
			End: &calendar.EventDateTime{Date: "", DateTime: "2023-04-20T00:00:00Z"},
		}
		googleCalendar, server := getEventModifyGoogleCalendar(t, &expectedEvent, accountID, eventID)
		defer server.Close()

		err := googleCalendar.ModifyEvent(db, userID, accountID, eventID, &eventModifyObj)
		assert.NoError(t, err)
	})
	t.Run("SuccessWithStartAndEndDate", func(t *testing.T) {
		datetimeStart := testutils.CreateTimestamp("2020-04-19")
		datetimeEnd := testutils.CreateTimestamp("2020-04-20")
		eventModifyObj := EventModifyObject{
			AccountID:     accountID,
			DatetimeStart: datetimeStart,
			DatetimeEnd:   datetimeEnd,
		}
		expectedEvent := calendar.Event{
			Start: &calendar.EventDateTime{Date: "", DateTime: "2020-04-19T00:00:00Z"},
			End:   &calendar.EventDateTime{Date: "", DateTime: "2020-04-20T00:00:00Z"},
		}
		googleCalendar, server := getEventModifyGoogleCalendar(t, &expectedEvent, accountID, eventID)
		defer server.Close()

		err := googleCalendar.ModifyEvent(db, userID, accountID, eventID, &eventModifyObj)
		assert.NoError(t, err)
	})
	t.Run("SuccessWithSummaryAndDescription", func(t *testing.T) {
		summary := "test summary"
		description := "test description"
		eventModifyObj := EventModifyObject{
			AccountID:   accountID,
			Summary:     &summary,
			Description: &description,
		}
		expectedEvent := calendar.Event{
			Summary:     summary,
			Description: description,
		}
		googleCalendar, server := getEventModifyGoogleCalendar(t, &expectedEvent, accountID, eventID)
		defer server.Close()

		err := googleCalendar.ModifyEvent(db, userID, accountID, eventID, &eventModifyObj)
		assert.NoError(t, err)
	})
	t.Run("EmptyModifyObject", func(t *testing.T) {
		eventModifyObj := EventModifyObject{}
		expectedEvent := calendar.Event{}
		googleCalendar, server := getEventModifyGoogleCalendar(t, &expectedEvent, accountID, eventID)
		defer server.Close()

		err := googleCalendar.ModifyEvent(db, userID, accountID, eventID, &eventModifyObj)
		assert.NoError(t, err)
	})
	t.Run("ExternalError", func(t *testing.T) {
		datetimeStart := testutils.CreateTimestamp("2020-04-19")
		datetimeEnd := testutils.CreateTimestamp("2020-04-20")
		eventModifyObj := EventModifyObject{
			AccountID:     "wrong account ID",
			DatetimeStart: datetimeStart,
			DatetimeEnd:   datetimeEnd,
		}
		googleCalendar, server := getEventModifyGoogleCalendar(t, nil, accountID, eventID)
		defer server.Close()

		err := googleCalendar.ModifyEvent(db, userID, accountID, eventID, &eventModifyObj)
		assert.Error(t, err)
	})
}
func assertCalendarEventsEqual(t *testing.T, a *database.CalendarEvent, b *database.CalendarEvent) {
	assert.Equal(t, a.DatetimeStart, b.DatetimeStart)
	assert.Equal(t, a.DatetimeEnd, b.DatetimeEnd)
	assert.Equal(t, a.Deeplink, b.Deeplink)
	assert.Equal(t, a.IDExternal, b.IDExternal)
	assert.Equal(t, a.Title, b.Title)
	assert.Equal(t, a.SourceID, b.SourceID)
	assert.Equal(t, a.CanModify, b.CanModify)
	assert.Equal(t, a.CallLogo, b.CallLogo)
	assert.Equal(t, a.CallPlatform, b.CallPlatform)
	assert.Equal(t, a.CallURL, b.CallURL)
}

func assertGcalCalendarEventsEqual(t *testing.T, a *calendar.Event, b *calendar.Event) {
	assert.Equal(t, a.Description, b.Description)
	assert.Equal(t, a.Location, b.Location)
	assert.Equal(t, a.Summary, b.Summary)
	if a.Start != nil && b.Start != nil {
		assert.Equal(t, a.Start.DateTime, b.Start.DateTime)
		assert.Equal(t, a.Start.TimeZone, b.Start.TimeZone)
	} else {
		assert.Equal(t, a.Start, b.Start)
	}
	if a.End != nil && b.End != nil {
		assert.Equal(t, a.End.DateTime, b.End.DateTime)
		assert.Equal(t, a.End.TimeZone, b.End.TimeZone)
	} else {
		assert.Equal(t, a.End, b.End)
	}
	assert.Equal(t, len(a.Attendees), len(b.Attendees))
	if len(a.Attendees) == len(b.Attendees) {
		for i := range a.Attendees {
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
		if expectedEvent == nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"detail": "gcal internal error"}`))
			return
		}

		var requestEvent calendar.Event
		json.NewDecoder(r.Body).Decode(&requestEvent)

		// Verify request is built correctly
		assertGcalCalendarEventsEqual(t, expectedEvent, &requestEvent)
		if eventCreateObj.AddConferenceCall {
			assert.NotNil(t, requestEvent.ConferenceData)
			assert.Equal(t,
				requestEvent.ConferenceData.CreateRequest.ConferenceSolutionKey.Type,
				expectedEvent.ConferenceData.CreateRequest.ConferenceSolutionKey.Type)
		}

		w.WriteHeader(201)
		w.Write([]byte(`{}`))
		return
	}))
}

func getEventDeleteServer(t *testing.T, expectedRequestURI string) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if expectedRequestURI == "" {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"detail": "gcal internal error"}`))
			return
		}

		assert.Equal(t, expectedRequestURI, r.RequestURI)

		w.WriteHeader(200)
		w.Write([]byte(`{}`))
		return
	}))
}

func getEventModifyGoogleCalendar(t *testing.T, expectedEvent *calendar.Event, calendarID string, eventID string) (*GoogleCalendarSource, *httptest.Server) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if expectedEvent == nil {
			w.WriteHeader(http.StatusInternalServerError)
			_, err := w.Write([]byte(`{"detail": "gcal internal error"}`))
			assert.NoError(t, err)
			return
		}

		// assert that URL is properly constructed
		assert.Equal(t, fmt.Sprintf("/calendars/%s/events/%s?alt=json&prettyPrint=false", calendarID, eventID), r.RequestURI)

		var requestEvent calendar.Event
		err := json.NewDecoder(r.Body).Decode(&requestEvent)
		assert.NoError(t, err)

		// Verify request is built correctly
		assertGcalCalendarEventsEqual(t, expectedEvent, &requestEvent)

		w.WriteHeader(201)
		_, err = w.Write([]byte(`{}`))
		assert.NoError(t, err)
		return
	}))
	googleCalendar := &GoogleCalendarSource{
		Google: GoogleService{
			OverrideURLs: GoogleURLOverrides{CalendarModifyURL: &server.URL},
		},
	}
	return googleCalendar, server
}
