package external

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"google.golang.org/api/calendar/v3"

	"github.com/GeneralTask/task-manager/backend/logging"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/utils"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/api/option"
)

type GoogleCalendarSource struct {
	Google GoogleService
}

func (googleCalendar GoogleCalendarSource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	calendarService, err := createGcalService(googleCalendar.Google.OverrideURLs.CalendarFetchURL, userID, accountID, context.Background())
	if err != nil {
		result <- emptyCalendarResult(err)
		return
	}
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyCalendarResult(err)
		return
	}
	defer dbCleanup()

	calendarResponse, err := calendarService.Events.
		List("primary").
		TimeMin(startTime.Format(time.RFC3339)).
		TimeMax(endTime.Format(time.RFC3339)).
		SingleEvents(true).
		OrderBy("startTime").
		Do()
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("unable to load calendar events")
		result <- emptyCalendarResult(err)
		return
	}

	events := []*database.Item{}
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
				IDTaskSection:   constants.IDTaskSectionDefault,
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
		dbEvent, err := database.UpdateOrCreateItem(
			db,
			userID,
			event.IDExternal,
			event.SourceID,
			event,
			database.CalendarEventItemChangeable{
				CalendarEvent: event.CalendarEvent,
				Title:         event.Title,
				Body:          event.TaskBase.Body,
				TaskType:      event.TaskType,
			},
			nil,
			false,
		)
		if err != nil {
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

func (googleCalendar GoogleCalendarSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	return primitive.NilObjectID, errors.New("has not been implemented yet")
}

func (googleCalendar GoogleCalendarSource) CreateNewEvent(userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	calendarService, err := createGcalService(googleCalendar.Google.OverrideURLs.CalendarFetchURL, userID, accountID, context.Background())
	if err != nil {
		return err
	}

	// TODO - add ID generated from backend or client to prevent duplication
	gcalEvent := &calendar.Event{
		Summary:     event.Summary,
		Location:    event.Location,
		Description: event.Description,
		Start: &calendar.EventDateTime{
			DateTime: event.DatetimeStart.Format(time.RFC3339),
			TimeZone: event.TimeZone,
		},
		End: &calendar.EventDateTime{
			DateTime: event.DatetimeEnd.Format(time.RFC3339),
			TimeZone: event.TimeZone,
		},
		Attendees: *createGcalAttendees(&event.Attendees),
	}
	if event.AddConferenceCall {
		gcalEvent.ConferenceData = createConferenceCallRequest()
	}

	gcalEvent, err = calendarService.Events.Insert(accountID, gcalEvent).
		ConferenceDataVersion(1).
		Do()
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("unable to create event")
		return err
	}
	log.Info().Msgf("Event created: %s\n", gcalEvent.HtmlLink)

	return nil
}

func (googleCalendar GoogleCalendarSource) DeleteEvent(userID primitive.ObjectID, accountID string, externalID string) error {
	// TODO: create a EventDeleteURL
	calendarService, err := createGcalService(googleCalendar.Google.OverrideURLs.CalendarFetchURL, userID, accountID, context.Background())
	if err != nil {
		return err
	}

	err = calendarService.Events.Delete(accountID, externalID).Do()
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("unable to create event")
		return err
	}
	log.Info().Msgf("gcal event successfully deleted externalID=%s", externalID)

	return nil
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

func (googleCalendar GoogleCalendarSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskItemChangeableFields, task *database.Item) error {
	if updateFields.IsCompleted != nil && *updateFields.IsCompleted {
		return errors.New("cannot mark calendar event as done")
	}
	return nil
}

func createGcalAttendees(attendees *[]Attendee) *[]*calendar.EventAttendee {
	var attendeesList []*calendar.EventAttendee
	for _, attendee := range *attendees {
		attendeesList = append(attendeesList, &calendar.EventAttendee{
			DisplayName: attendee.Name,
			Email:       attendee.Email,
		})
	}
	return &attendeesList
}

func (googleCalendar GoogleCalendarSource) ModifyEvent(userID primitive.ObjectID, accountID string, eventID string, updateFields *EventModifyObject) error {
	calendarService, err := createGcalService(googleCalendar.Google.OverrideURLs.CalendarFetchURL, userID, accountID, context.Background())
	if err != nil {
		return err
	}

	gcalEvent := calendar.Event{}
	if updateFields.Summary != nil {
		gcalEvent.Summary = *updateFields.Summary
	}
	if updateFields.Location != nil {
		gcalEvent.Location = *updateFields.Location
	}
	if updateFields.Description != nil {
		gcalEvent.Description = *updateFields.Description
	}
	if updateFields.DatetimeStart != nil {
		gcalEvent.Start = &calendar.EventDateTime{
			DateTime: updateFields.DatetimeStart.Format(time.RFC3339),
		}
	}
	if updateFields.DatetimeEnd != nil {
		gcalEvent.End = &calendar.EventDateTime{
			DateTime: updateFields.DatetimeEnd.Format(time.RFC3339),
		}
	}
	if updateFields.Attendees != nil {
		gcalEvent.Attendees = *createGcalAttendees(updateFields.Attendees)
	}
	_, err = calendarService.Events.Patch(accountID, eventID, &gcalEvent).Do()
	if err != nil {
		return err
	}
	return nil
}

func createConferenceCallRequest() *calendar.ConferenceData {
	// todo - add client generated requestId
	return &calendar.ConferenceData{
		CreateRequest: &calendar.CreateConferenceRequest{
			ConferenceSolutionKey: &calendar.ConferenceSolutionKey{
				Type: "hangoutsMeet",
			},
			RequestId: uuid.New().String(),
		},
	}
}

func createGcalService(overrideURL *string, userID primitive.ObjectID, accountID string, ctx context.Context) (*calendar.Service, error) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return nil, err
	}
	defer dbCleanup()

	var calendarService *calendar.Service
	logger := logging.GetSentryLogger()
	if overrideURL != nil {
		extCtx, cancel := context.WithTimeout(ctx, constants.ExternalTimeout)
		defer cancel()
		calendarService, err = calendar.NewService(
			extCtx,
			option.WithoutAuthentication(),
			option.WithEndpoint(*overrideURL),
		)
	} else {
		client := getGoogleHttpClient(db, userID, accountID)
		if client == nil {
			logger.Error().Msg("failed to fetch google API token")
			return nil, errors.New("failed to fetch google API token")
		}
		extCtx, cancel := context.WithTimeout(ctx, constants.ExternalTimeout)
		defer cancel()
		calendarService, err = calendar.NewService(extCtx, option.WithHTTPClient(client))
	}
	if err != nil {
		logger.Error().Err(err).Msg("unable to create calendar service")
		return nil, fmt.Errorf("unable to create calendar service")
	}
	return calendarService, nil
}
