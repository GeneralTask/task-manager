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
	"github.com/GeneralTask/task-manager/backend/utils"
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

func (googleCalendar GoogleCalendarSource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	parentCtx := context.Background()
	events := []*database.Item{}

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
		client := getGoogleHttpClient(db, userID, accountID)
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

	calendarResponse, err := calendarService.Events.
		List("primary").
		TimeMin(startTime.Format(time.RFC3339)).
		TimeMax(endTime.Format(time.RFC3339)).
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
		event := &database.Item{
			TaskBase: database.TaskBase{
				UserID:          userID,
				IDExternal:      event.Id,
				IDTaskSection:   constants.IDTaskSectionToday,
				Deeplink:        fmt.Sprintf("%s&authuser=%s", event.HtmlLink, accountID),
				SourceID:        TASK_SOURCE_ID_GCAL,
				Title:           event.Summary,
				Body:            event.Description,
				TimeAllocation:  endTime.Sub(startTime).Nanoseconds(),
				SourceAccountID: accountID,
				ConferenceCall:  GetConferenceCall(event, accountID),
			},
			CalendarEvent: database.CalendarEvent{
				DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
				DatetimeStart: primitive.NewDateTimeFromTime(startTime),
			},
			TaskType: database.TaskType{
				IsEvent: true,
			},
		}
		var dbEvent database.Item
		res, err := database.UpdateOrCreateTask(
			db,
			userID,
			event.IDExternal,
			event.SourceID,
			event,
			database.CalendarEventChangeableFields{
				CalendarEvent: event.CalendarEvent,
				Title:         event.Title,
				Body:          event.Body,
				TaskType:      event.TaskType,
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
		event.HasBeenReordered = dbEvent.HasBeenReordered
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

func (googleCalendar GoogleCalendarSource) GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil)
}

func (googleCalendar GoogleCalendarSource) Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, emailContents EmailContents) error {
	return errors.New("cannot reply to a calendar event")
}

func (googleCalendar GoogleCalendarSource) SendEmail(userID primitive.ObjectID, accountID string, email EmailContents) error {
	return errors.New("cannot send email for calendar event")
}

func (googleCalendar GoogleCalendarSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	return errors.New("has not been implemented yet")
}

func GetConferenceCall(event *calendar.Event, accountID string) *database.ConferenceCall {
	// first check for built-in conference URL
	var conferenceCall *database.ConferenceCall
	if event.ConferenceData != nil {
		for _, entryPoint := range event.ConferenceData.EntryPoints {
			if entryPoint != nil {
				conferenceCall = &database.ConferenceCall{
					Platform: event.ConferenceData.ConferenceSolution.Name,
					Logo:     event.ConferenceData.ConferenceSolution.IconUri,
					URL:      entryPoint.Uri,
				}
				break
			}
		}
	}
	// then check the description for a conference URL
	if conferenceCall == nil && event.Description != "" {
		conferenceCall = utils.GetConferenceUrlFromString(event.Description)
	}

	if conferenceCall != nil && strings.Contains(conferenceCall.URL, "meet.google.com") {
		conferenceCall.URL += "?authuser=" + accountID
	}

	return conferenceCall
}

func (googleCalendar GoogleCalendarSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskChangeableFields) error {
	if updateFields.IsCompleted != nil && *updateFields.IsCompleted {
		return errors.New("cannot mark calendar event as done")
	}
	return nil
}

func (googleCalendar GoogleCalendarSource) ModifyMessage(userID primitive.ObjectID, accountID string, emailID string, updateFields *database.MessageChangeable) error {
	return nil
}
