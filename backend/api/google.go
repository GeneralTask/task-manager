package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/GeneralTask/task-manager/backend/utils"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/oauth2"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

// GoogleRedirectParams ...
type GoogleRedirectParams struct {
	State string `form:"state"`
	Code  string `form:"code"`
	Scope string `form:"scope"`
}

// GoogleUserInfo ...
type GoogleUserInfo struct {
	SUB   string `json:"sub"`
	EMAIL string `json:"email"`
}

func GetGoogleConfig() OauthConfigWrapper {
	googleConfig := &oauth2.Config{
		ClientID:     config.GetConfigValue("GOOGLE_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("GOOGLE_OAUTH_CLIENT_SECRET"),
		RedirectURL:  config.GetConfigValue("GOOGLE_OAUTH_REDIRECT_URL"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.events"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/auth",
			TokenURL: "https://oauth2.googleapis.com/token",
		},
	}
	return &OauthConfig{Config: googleConfig}
}

func loadEmails(userID primitive.ObjectID, client *http.Client, result chan<- []*database.Email) {
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	userObject := database.GetUser(db, userID)
	userDomain := utils.ExtractEmailDomain(userObject.Email)

	emails := []*database.Email{}

	gmailService, err := gmail.NewService(context.TODO(), option.WithHTTPClient(client))
	if err != nil {
		log.Fatalf("Unable to create Gmail service: %v", err)
	}

	threadsResponse, err := gmailService.Users.Threads.List("me").Q("label:inbox is:unread").Do()
	if err != nil {
		log.Fatalf("Failed to load Gmail threads for user: %v", err)
	}
	for _, threadListItem := range threadsResponse.Threads {
		thread, err := gmailService.Users.Threads.Get("me", threadListItem.Id).Do()
		if err != nil {
			log.Fatalf("failed to load thread! %v", err)
		}
		var sender = ""
		var title = ""
		for _, header := range thread.Messages[0].Payload.Headers {
			if header.Name == "From" {
				sender = header.Value
			}
			if header.Name == "Subject" {
				title = header.Value
			}
		}

		senderName, senderEmail := utils.ExtractSenderName(sender)
		senderDomain := utils.ExtractEmailDomain(senderEmail)

		var timeAllocation time.Duration
		if senderDomain == userDomain {
			timeAllocation = time.Minute * 5
		} else {
			timeAllocation = time.Minute * 2
		}

		email := &database.Email{
			TaskBase: database.TaskBase{
				UserID:         userID,
				IDExternal:     threadListItem.Id,
				Sender:         senderName,
				Source:         database.TaskSourceGmail.Name,
				Deeplink:       fmt.Sprintf("https://mail.google.com/mail?authuser=%s#all/%s", userObject.Email, threadListItem.Id),
				Title:          title,
				Logo:           database.TaskSourceGmail.Logo,
				IsCompletable:  database.TaskSourceGmail.IsCompletable,
				TimeAllocation: timeAllocation.Nanoseconds(),
			},
			SenderDomain: senderDomain,
		}
		dbEmail := database.GetOrCreateTask(db, userID, email.IDExternal, email.Source, email)
		if dbEmail != nil {
			email.ID = dbEmail.ID
			email.IDOrdering = dbEmail.IDOrdering
		}
		emails = append(emails, email)
	}

	result <- emails
}

func LoadCalendarEvents(
	api *API,
	userID primitive.ObjectID,
	client *http.Client,
	result chan<- []*database.CalendarEvent,
) {
	events := []*database.CalendarEvent{}

	var calendarService *calendar.Service
	var err error

	if api.GoogleURLs.CalendarFetchURL != nil {
		calendarService, err = calendar.NewService(
			context.Background(),
			option.WithoutAuthentication(),
			option.WithEndpoint(*api.GoogleURLs.CalendarFetchURL),
		)
	} else {
		calendarService, err = calendar.NewService(context.TODO(), option.WithHTTPClient(client))
	}
	if err != nil {
		log.Fatalf("Unable to create Calendar service: %v", err)
	}

	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()

	t := time.Now()
	//strip out hours/minutes/seconds of today to find the start of the day
	todayStartTime := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
	//get end of day but adding one day to start of day and then subtracting a second to get day at 11:59:59PM
	todayEndTime := todayStartTime.AddDate(0, 0, 1).Add(-time.Second)

	calendarResponse, err := calendarService.Events.
		List("primary").
		TimeMin(todayStartTime.Format(time.RFC3339)).
		TimeMax(todayEndTime.Format(time.RFC3339)).
		SingleEvents(true).
		OrderBy("startTime").
		Do()

	if err != nil {
		log.Fatalf("Unable to load calendar events: %v", err)
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

		startTime, _ := time.Parse(time.RFC3339, event.Start.DateTime)
		endTime, _ := time.Parse(time.RFC3339, event.End.DateTime)

		event := &database.CalendarEvent{
			TaskBase: database.TaskBase{
				UserID:         userID,
				IDExternal:     event.Id,
				Deeplink:       event.HtmlLink,
				Source:         database.TaskSourceGoogleCalendar.Name,
				Title:          event.Summary,
				Logo:           database.TaskSourceGoogleCalendar.Logo,
				IsCompletable:  database.TaskSourceGoogleCalendar.IsCompletable,
				TimeAllocation: endTime.Sub(startTime).Nanoseconds(),
			},
			DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
			DatetimeStart: primitive.NewDateTimeFromTime(startTime),
		}
		dbEvent := database.UpdateOrCreateTask(
			db,
			userID,
			event.IDExternal,
			event.Source,
			event,
			database.CalendarEventChangeableFields{
				Title:         event.Title,
				DatetimeEnd:   event.DatetimeEnd,
				DatetimeStart: event.DatetimeStart,
			},
		)
		if dbEvent != nil {
			event.ID = dbEvent.ID
			event.IDOrdering = dbEvent.IDOrdering
		}
		events = append(events, event)
	}
	result <- events
}

func MarkEmailAsRead(api *API, userID primitive.ObjectID, emailID string) bool {
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")
	client := getGoogleHttpClient(externalAPITokenCollection, userID)

	var gmailService *gmail.Service
	var err error
	if api.GoogleURLs.GmailModifyURL == nil {
		gmailService, err = gmail.New(client)
	} else {
		gmailService, err = gmail.NewService(
			context.Background(),
			option.WithoutAuthentication(),
			option.WithEndpoint(*api.GoogleURLs.GmailModifyURL))
	}

	if err != nil {
		log.Fatalf("Unable to create Gmail service: %v", err)
		return false
	}

	_, err = gmailService.Users.Threads.Modify(
		"me",
		emailID,
		&gmail.ModifyThreadRequest{RemoveLabelIds: []string{"INBOX"}},
	).Do()

	return err == nil
}

func getGoogleHttpClient(externalAPITokenCollection *mongo.Collection, userID primitive.ObjectID) *http.Client {
	var googleToken database.ExternalAPIToken

	if err := externalAPITokenCollection.FindOne(
		context.TODO(),
		bson.D{{Key: "user_id", Value: userID}, {Key: "source", Value: "google"}}).Decode(&googleToken); err != nil {
		return nil
	}

	var token oauth2.Token
	json.Unmarshal([]byte(googleToken.Token), &token)
	config := GetGoogleConfig()
	return config.Client(context.Background(), &token).(*http.Client)
}
