package external

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

type GoogleCalendarSource struct {
	Google GoogleService
}

func (googleCalendar GoogleCalendarSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult) {
	result <- emptyEmailResult(nil)
}

func (googleCalendar GoogleCalendarSource) GetEvents(userID primitive.ObjectID, accountID string, timezoneOffsetMinutes int, result chan<- CalendarResult) {
	parentCtx := context.Background()
	events := []*database.CalendarEvent{}

	var calendarService *calendar.Service
	var err error

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyCalendarResult(err)
		return
	}
	defer dbCleanup()

	if googleCalendar.Google.OverrideURLs.CalendarFetchURL != nil {
		extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		calendarService, err = calendar.NewService(
			extCtx,
			option.WithoutAuthentication(),
			option.WithEndpoint(*googleCalendar.Google.OverrideURLs.CalendarFetchURL),
		)
	} else {
		externalAPITokenCollection := database.GetExternalTokenCollection(db)
		client := GetGoogleHttpClient(externalAPITokenCollection, userID, accountID)
		if client == nil {
			log.Printf("failed to fetch google API token")
			result <- emptyCalendarResult(errors.New("failed to fetch google API token"))
			return
		}
		extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		calendarService, err = calendar.NewService(extCtx, option.WithHTTPClient(client))
	}
	if err != nil {
		log.Printf("unable to create calendar service: %v", err)
		result <- emptyCalendarResult(err)
		return
	}

	t := time.Now()
	// adjust timestamp by timezone offset to get correct year / month / day
	t = t.Add(time.Minute * -time.Duration(timezoneOffsetMinutes))
	//Javascript returns timezone offsets with the opposite parity so we need to convert negatives to positives
	//and vice versa.

	var timeZoneName string
	if timezoneOffsetMinutes > 0 {
		timeZoneName = fmt.Sprintf("UTC-%d", timezoneOffsetMinutes/constants.MINUTE)
	} else if timezoneOffsetMinutes < 0 {
		timeZoneName = fmt.Sprintf("UTC+%d", -timezoneOffsetMinutes/constants.MINUTE)
	} else {
		timeZoneName = "UTC"
	}
	location := time.FixedZone(timeZoneName, -timezoneOffsetMinutes*constants.MINUTE)
	//strip out hours/minutes/seconds of today to find the start of the day
	todayStartTime := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, location)
	//get end of day but adding one day to start of day and then subtracting a second to get day at 11:59:59PM
	todayEndTime := todayStartTime.AddDate(0, 0, 1).Add(-time.Second)

	calendarResponse, err := calendarService.Events.
		List("primary").
		TimeMin(time.Now().Format(time.RFC3339)).
		TimeMax(todayEndTime.Format(time.RFC3339)).
		SingleEvents(true).
		OrderBy("startTime").
		Do()

	if err != nil {
		log.Printf("unable to load calendar events: %v", err)
		result <- emptyCalendarResult(err)
		return
	}

	for _, event := range calendarResponse.Items {
		//exclude all day events which won't have a start time.
		if len(event.Start.DateTime) == 0 {
			continue
		}

		//exclude clockwise events
		if strings.Contains(strings.ToLower(event.Summary), "via clockwise") {
			continue
		}

		//exclude events we declined.
		didDeclineEvent := false
		for _, attendee := range event.Attendees {
			if attendee.Self && attendee.ResponseStatus == "declined" {
				didDeclineEvent = true
				continue
			}
		}
		if didDeclineEvent {
			continue
		}

		startTime, _ := time.Parse(time.RFC3339, event.Start.DateTime)
		endTime, _ := time.Parse(time.RFC3339, event.End.DateTime)

		GetConferenceURL(event)

		event := &database.CalendarEvent{
			TaskBase: database.TaskBase{
				UserID:          userID,
				IDExternal:      event.Id,
				IDTaskSection:   constants.IDTaskSectionToday,
				Deeplink:        event.HtmlLink,
				SourceID:        TASK_SOURCE_ID_GCAL,
				Title:           event.Summary,
				TimeAllocation:  endTime.Sub(startTime).Nanoseconds(),
				SourceAccountID: accountID,
			},
			DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
			DatetimeStart: primitive.NewDateTimeFromTime(startTime),
		}
		var dbEvent database.CalendarEvent
		res, err := database.UpdateOrCreateTask(
			db,
			userID,
			event.IDExternal,
			event.SourceID,
			event,
			database.CalendarEventChangeableFields{
				Title:         event.Title,
				DatetimeEnd:   event.DatetimeEnd,
				DatetimeStart: event.DatetimeStart,
			},
		)
		if err != nil {
			result <- emptyCalendarResult(err)
			return
		}
		err = res.Decode(&dbEvent)
		if err != nil {
			log.Printf("failed to update or create calendar event: %v", err)
			result <- emptyCalendarResult(err)
			return
		}
		event.ID = dbEvent.ID
		event.IDOrdering = dbEvent.IDOrdering
		// If the meeting is rescheduled, we want to reset the IDOrdering so that reordered tasks are not also moved
		if event.DatetimeStart != dbEvent.DatetimeStart {
			event.IDOrdering = 0
		}
		events = append(events, event)
	}
	result <- CalendarResult{CalendarEvents: events, Error: nil}
}

func (googleCalendar GoogleCalendarSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	result <- emptyTaskResult(nil)
}

func (googleCalendar GoogleCalendarSource) MarkAsDone(userID primitive.ObjectID, accountID string, taskID string) error {
	return errors.New("cannot mark calendar event as done")
}

func (googleCalendar GoogleCalendarSource) Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, body string) error {
	return errors.New("cannot reply to a calendar event")
}

func (googleCalendar GoogleCalendarSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	return errors.New("Has not been implemented yet")
}
func GetConferenceURL(event *calendar.Event) string {
	// first check for built-in conference URL
	if event.ConferenceData != nil && event.ConferenceData.EntryPoints != nil {
		for _, entryPoint := range event.ConferenceData.EntryPoints {
			if entryPoint != nil {
				return entryPoint.Uri
			}
		}
	}
	return ""
}
