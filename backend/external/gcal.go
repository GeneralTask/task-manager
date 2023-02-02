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
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"google.golang.org/api/option"
)

type GoogleCalendarSource struct {
	Google GoogleService
}

func processAndStoreEvent(event *calendar.Event, db *mongo.Database, userID primitive.ObjectID, accountID string, calendarID string) *database.CalendarEvent {
	//exclude all day events which won't have a start time.
	if len(event.Start.DateTime) == 0 {
		return &database.CalendarEvent{}
	}

	//exclude events we declined.
	for _, attendee := range event.Attendees {
		if attendee.Self && attendee.ResponseStatus == "declined" {
			return &database.CalendarEvent{}
		}
	}

	dbStartTime, _ := time.Parse(time.RFC3339, event.Start.DateTime)
	dbEndTime, _ := time.Parse(time.RFC3339, event.End.DateTime)
	conferenceCall := GetConferenceCall(event, accountID)
	canModify := event.GuestsCanModify
	if event.Organizer != nil {
		canModify = canModify || event.Organizer.Self
	}
	if calendarID == "primary" {
		calendarID = accountID
	}
	dbEvent := &database.CalendarEvent{
		UserID:          userID,
		IDExternal:      event.Id,
		CalendarID:      calendarID,
		ColorID:         event.ColorId,
		Deeplink:        fmt.Sprintf("%s&authuser=%s", event.HtmlLink, accountID),
		SourceID:        TASK_SOURCE_ID_GCAL,
		Title:           event.Summary,
		Body:            event.Description,
		Location:        event.Location,
		TimeAllocation:  dbEndTime.Sub(dbStartTime).Nanoseconds(),
		SourceAccountID: accountID,
		DatetimeEnd:     primitive.NewDateTimeFromTime(dbEndTime),
		DatetimeStart:   primitive.NewDateTimeFromTime(dbStartTime),
		CanModify:       canModify,
		CallURL:         conferenceCall.URL,
		CallLogo:        conferenceCall.Logo,
		CallPlatform:    conferenceCall.Platform,
	}

	dbEvent, err := database.UpdateOrCreateCalendarEvent(
		db,
		userID,
		dbEvent.IDExternal,
		dbEvent.SourceID,
		dbEvent,
		nil,
	)
	if err != nil {
		log.Error().Msgf("could not store event in db %+v", dbEvent)
		return &database.CalendarEvent{}
	}
	return dbEvent
}

func (googleCalendar GoogleCalendarSource) fetchEvents(calendarService *calendar.Service, db *mongo.Database, userID primitive.ObjectID, accountID string, calendarId string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	calendarResponse, err := calendarService.Events.
		List(calendarId).
		TimeMin(startTime.Format(time.RFC3339)).
		TimeMax(endTime.Format(time.RFC3339)).
		MaxResults(2500).
		SingleEvents(true).
		OrderBy("startTime").
		Do()
	logger := logging.GetSentryLogger()

	if err != nil {
		isBadToken := CheckAndHandleBadToken(err, db, userID, accountID, TASK_SERVICE_ID_GOOGLE)
		if !isBadToken {
			logger.Error().Err(err).Msg("unable to load calendar events")
		}
		result <- emptyCalendarResult(err)
		return
	}

	var events []*database.CalendarEvent
	for _, event := range calendarResponse.Items {
		dbEvent := processAndStoreEvent(event, db, userID, accountID, calendarId)
		if dbEvent != nil && *dbEvent != (database.CalendarEvent{}) {
			events = append(events, dbEvent)
		}
	}
	result <- CalendarResult{events, nil}
}

func (googleCalendar GoogleCalendarSource) GetEvents(db *mongo.Database, userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, scopes []string, result chan<- CalendarResult) {
	if !database.HasUserGrantedCalendarScope(scopes) {
		result <- emptyCalendarResult(nil)
		return
	}
	calendarService, err := createGcalService(googleCalendar.Google.OverrideURLs.CalendarFetchURL, userID, accountID, context.Background(), db)
	if err != nil {
		result <- emptyCalendarResult(err)
		return
	}
	calendarAccount := database.CalendarAccount{
		UserID:     userID,
		IDExternal: accountID,
		SourceID:   TASK_SOURCE_ID_GCAL,
		Scopes:     scopes,
	}
	var events []*database.CalendarEvent

	fetchAllCalendars := false
	var calendarList *calendar.CalendarList
	if database.HasUserGrantedMultiCalendarScope(scopes) {
		calendarList, err = calendarService.CalendarList.List().Do()
		if err == nil && calendarList != nil {
			fetchAllCalendars = true
		} else {
			log.Error().Err(err).Send()
		}
	}

	// If we can't fetch the calendar list, we try fetching just the primary calendar
	if !fetchAllCalendars {
		log.Debug().Err(err).Msgf("could not fetch calendar list for accountID: %s", accountID)
		eventChannel := make(chan CalendarResult)
		go googleCalendar.fetchEvents(calendarService, db, userID, accountID, "primary", startTime, endTime, eventChannel)
		eventResult := <-eventChannel
		if eventResult.Error != nil {
			result <- emptyCalendarResult(errors.New("failed to fetch events"))
		}
		events = append(events, eventResult.CalendarEvents...)
		calendarAccount.Calendars = []database.Calendar{
			{
				CalendarID: accountID,
				AccessRole: "owner",
				ColorID:    "",
				Title:      "",
			},
		}
		_, err = database.UpdateOrCreateCalendarAccount(db, userID, accountID, TASK_SOURCE_ID_GCAL, calendarAccount, nil)
		if err != nil {
			result <- emptyCalendarResult(err)
		}
		result <- CalendarResult{CalendarEvents: events, Error: nil}
		return
	}

	var calendars []database.Calendar
	eventsChannels := []chan CalendarResult{}
	for _, calendar := range calendarList.Items {
		calendars = append(calendars, database.Calendar{
			AccessRole: calendar.AccessRole,
			CalendarID: calendar.Id,
			ColorID:    calendar.ColorId,
			Title:      calendar.Summary,
		})
		eventChannel := make(chan CalendarResult)
		go googleCalendar.fetchEvents(calendarService, db, userID, accountID, calendar.Id, startTime, endTime, eventChannel)
		eventsChannels = append(eventsChannels, eventChannel)
	}
	for _, eventChannel := range eventsChannels {
		eventResult := <-eventChannel
		if eventResult.Error != nil {
			continue
		}
		events = append(events, eventResult.CalendarEvents...)
	}
	calendarAccount.Calendars = calendars
	_, err = database.UpdateOrCreateCalendarAccount(db, userID, accountID, TASK_SOURCE_ID_GCAL, calendarAccount, nil)
	if err != nil {
		log.Error().Err(err).Msgf("could not create CalendarAccount: %+v", calendarAccount)
	}
	result <- CalendarResult{CalendarEvents: events, Error: nil}
}

func (googleCalendar GoogleCalendarSource) GetTasks(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	result <- emptyTaskResult(nil)
}

func (googleCalendar GoogleCalendarSource) GetPullRequests(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil, false)
}

func (googleCalendar GoogleCalendarSource) CreateNewTask(db *mongo.Database, userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	return primitive.NilObjectID, errors.New("has not been implemented yet")
}

func (googleCalendar GoogleCalendarSource) AddComment(db *mongo.Database, userID primitive.ObjectID, accountID string, comment database.Comment, task *database.Task) error {
	return errors.New("has not been implemented yet")
}

func (googleCalendar GoogleCalendarSource) CreateNewEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	calendarService, err := createGcalService(googleCalendar.Google.OverrideURLs.CalendarCreateURL, userID, accountID, context.Background(), db)
	if err != nil {
		return err
	}

	gcalEvent := &calendar.Event{
		Id:          event.ID.Hex(),
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
	if event.LinkedTaskID != primitive.NilObjectID || event.LinkedViewID != primitive.NilObjectID {
		gcalEvent.Visibility = "private"
	}

	calendarID := event.AccountID
	if event.CalendarID != "" {
		calendarID = event.CalendarID
	}
	gcalEvent, err = calendarService.Events.Insert(calendarID, gcalEvent).
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

func (googleCalendar GoogleCalendarSource) DeleteEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, externalID string, calendarID string) error {
	// TODO: create a EventDeleteURL
	calendarService, err := createGcalService(googleCalendar.Google.OverrideURLs.CalendarDeleteURL, userID, accountID, context.Background(), db)
	if err != nil {
		return err
	}

	calendarIDToDelete := accountID
	if calendarID != "" {
		calendarIDToDelete = calendarID
	}
	err = calendarService.Events.Delete(calendarIDToDelete, externalID).Do()
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("unable to create event")
		return err
	}
	log.Info().Msgf("gcal event successfully deleted externalID=%s", externalID)

	return nil
}

// returns true if the error was because of a bad token
func CheckAndHandleBadToken(err error, db *mongo.Database, userID primitive.ObjectID, accountID string, serviceID string) bool {
	if !strings.Contains(err.Error(), "oauth2: token expired and refresh token is not set") &&
		!strings.Contains(err.Error(), "Token has been expired or revoked") &&
		!strings.Contains(err.Error(), "Request had insufficient authentication scopes") {
		return false
	}
	token, err := getExternalToken(db, userID, accountID, serviceID)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Str("userID", userID.Hex()).Str("accountID", accountID).Str("serviceID", serviceID).Err(err).Msg("unable to get external token")
		return true
	}

	_, err = database.GetExternalTokenCollection(db).UpdateOne(
		context.Background(),
		bson.M{"_id": token.ID},
		bson.M{"$set": bson.M{"is_bad_token": true}},
	)
	if err != nil {
		logger.Error().Str("tokenID", token.ID.Hex()).Err(err).Msg("unable to update external token")
	}
	return true
}

func GetConferenceCall(event *calendar.Event, accountID string) *utils.ConferenceCall {
	// first check for built-in conference URL
	var conferenceCall *utils.ConferenceCall
	if event.ConferenceData != nil {
		for _, entryPoint := range event.ConferenceData.EntryPoints {
			if entryPoint != nil {
				conferenceCall = &utils.ConferenceCall{
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

	if conferenceCall != nil {
		return conferenceCall
	}
	return &utils.ConferenceCall{}
}

func (googleCalendar GoogleCalendarSource) ModifyTask(db *mongo.Database, userID primitive.ObjectID, accountID string, issueID string, updateFields *database.Task, task *database.Task) error {
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

func (googleCalendar GoogleCalendarSource) ModifyEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, eventID string, updateFields *EventModifyObject) error {
	calendarService, err := createGcalService(googleCalendar.Google.OverrideURLs.CalendarModifyURL, userID, accountID, context.Background(), db)
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
	calendarID := accountID
	if updateFields.CalendarID != "" {
		calendarID = updateFields.CalendarID
	}
	_, err = calendarService.Events.Patch(calendarID, eventID, &gcalEvent).Do()
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

func createGcalService(overrideURL *string, userID primitive.ObjectID, accountID string, ctx context.Context, db *mongo.Database) (*calendar.Service, error) {
	var calendarService *calendar.Service
	logger := logging.GetSentryLogger()
	var err error
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
