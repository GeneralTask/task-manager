package api

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/GeneralTask/task-manager/backend/templating"

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
	Name  string `json:"name"`
}

func GetGoogleConfig() OauthConfigWrapper {
	googleConfig := &oauth2.Config{
		ClientID:     config.GetConfigValue("GOOGLE_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("GOOGLE_OAUTH_CLIENT_SECRET"),
		RedirectURL:  config.GetConfigValue("GOOGLE_OAUTH_REDIRECT_URL"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.events"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/auth",
			TokenURL: "https://oauth2.googleapis.com/token",
		},
	}
	return &OauthConfig{Config: googleConfig}
}

type EmailResult struct {
	Emails []*database.Email
	Error  error
}

func loadEmails(userID primitive.ObjectID, client *http.Client, result chan<- EmailResult) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyEmailResult(err)
		return
	}
	defer dbCleanup()
	userObject, err := database.GetUser(db, userID)
	if err != nil {
		result <- emptyEmailResult(err)
		return
	}
	userDomain := utils.ExtractEmailDomain(userObject.Email)

	emails := []*database.Email{}

	gmailService, err := gmail.NewService(context.TODO(), option.WithHTTPClient(client))
	if err != nil {
		log.Printf("Unable to create Gmail service: %v", err)
		result <- emptyEmailResult(err)
		return
	}

	threadsResponse, err := gmailService.Users.Threads.List("me").Q("label:inbox is:unread").Do()
	if err != nil {
		log.Printf("Failed to load Gmail threads for user: %v", err)
		result <- emptyEmailResult(err)
		return
	}
	for _, threadListItem := range threadsResponse.Threads {
		thread, err := gmailService.Users.Threads.Get("me", threadListItem.Id).Do()
		if err != nil {
			log.Printf("failed to load thread! %v", err)
			result <- emptyEmailResult(err)
			return
		}

		for _, message := range thread.Messages {
			if !isMessageUnread(message) {
				continue
			}

			var sender = ""
			var title = ""
			for _, header := range message.Payload.Headers {
				if header.Name == "From" {
					sender = header.Value
				}
				if header.Name == "Subject" {
					title = header.Value
				}
			}
			var body *string

			for _, messagePart := range message.Payload.Parts {
				if messagePart.MimeType == "text/html" {
					body, err = parseMessagePartBody(messagePart.MimeType, messagePart.Body)
					if err != nil {
						result <- emptyEmailResult(err)
						return
					}
				} else if messagePart.MimeType == "text/plain" && (body == nil || len(*body) == 0) {
					//Only use plain text if we haven't found html, prefer html.
					body, err = parseMessagePartBody(messagePart.MimeType, messagePart.Body)
					if err != nil {
						result <- emptyEmailResult(err)
						return
					}
				}
			}

			//fallback to body if there are no parts.
			if body == nil || len(*body) == 0 {
				body, err = parseMessagePartBody(message.Payload.MimeType, message.Payload.Body)
				if err != nil {
					result <- emptyEmailResult(err)
					return
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
					IDExternal:     message.Id,
					Sender:         senderName,
					Source:         database.TaskSourceGmail,
					Deeplink:       fmt.Sprintf("https://mail.google.com/mail?authuser=%s#all/%s", userObject.Email, threadListItem.Id),
					Title:          title,
					Body:           *body,
					TimeAllocation: timeAllocation.Nanoseconds(),
				},
				SenderDomain: senderDomain,
				ThreadID:     threadListItem.Id,
				TimeSent:     primitive.NewDateTimeFromTime(time.Unix(message.InternalDate/1000, 0)),
			}
			dbEmail, err := database.GetOrCreateTask(db, userID, email.IDExternal, email.Source, email)
			if err != nil {
				result <- emptyEmailResult(err)
				return
			}
			if dbEmail != nil {
				email.ID = dbEmail.ID
				email.IDOrdering = dbEmail.IDOrdering
			}
			emails = append(emails, email)
		}
	}
	result <- EmailResult{Emails: emails, Error: nil}
}

func emptyEmailResult(err error) EmailResult {
	return EmailResult{
		Emails: []*database.Email{},
		Error:  err,
	}
}

func isMessageUnread(message *gmail.Message) bool {
	for _, label := range message.LabelIds {
		if label == "UNREAD" {
			return true
		}
	}
	return false
}

func parseMessagePartBody(mimeType string, body *gmail.MessagePartBody) (*string, error) {
	data := body.Data
	bodyData, err := base64.URLEncoding.DecodeString(data)
	if err != nil {
		log.Printf("failed to decode email body. %v", err)
		return nil, err
	}

	bodyString := string(bodyData)

	if mimeType == "text/plain" {
		formattedBody, err := templating.FormatPlainTextAsHTML(bodyString)
		if err != nil {
			log.Printf("failed to decode email body. %v", err)
			return nil, err
		} else {
			bodyString = formattedBody
		}
	}

	return &bodyString, nil
}

type CalendarResult struct {
	CalendarEvents []*database.CalendarEvent
	Error          error
}

func LoadCalendarEvents(
	api *API,
	userID primitive.ObjectID,
	client *http.Client,
	result chan<- CalendarResult,
) {
	events := []*database.CalendarEvent{}

	var calendarService *calendar.Service
	var err error

	if api.GoogleOverrideURLs.CalendarFetchURL != nil {
		calendarService, err = calendar.NewService(
			context.Background(),
			option.WithoutAuthentication(),
			option.WithEndpoint(*api.GoogleOverrideURLs.CalendarFetchURL),
		)
	} else {
		calendarService, err = calendar.NewService(context.TODO(), option.WithHTTPClient(client))
	}
	if err != nil {
		log.Printf("Unable to create Calendar service: %v", err)
		result <- emptyCalendarResult(err)
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyCalendarResult(err)
		return
	}
	defer dbCleanup()

	t := time.Now()
	//strip out hours/minutes/seconds of today to find the start of the day
	todayStartTime := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
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
		log.Printf("Unable to load calendar events: %v", err)
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

		startTime, _ := time.Parse(time.RFC3339, event.Start.DateTime)
		endTime, _ := time.Parse(time.RFC3339, event.End.DateTime)

		event := &database.CalendarEvent{
			TaskBase: database.TaskBase{
				UserID:         userID,
				IDExternal:     event.Id,
				Deeplink:       event.HtmlLink,
				Source:         database.TaskSourceGoogleCalendar,
				Title:          event.Summary,
				TimeAllocation: endTime.Sub(startTime).Nanoseconds(),
			},
			DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
			DatetimeStart: primitive.NewDateTimeFromTime(startTime),
		}
		var dbEvent database.CalendarEvent
		res, err := database.UpdateOrCreateTask(
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
		if err != nil {
			result <- emptyCalendarResult(err)
			return
		}
		err = res.Decode(&dbEvent)
		if err != nil {
			log.Printf("Failed to update or create calendar event: %v", err)
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

func emptyCalendarResult(err error) CalendarResult {
	return CalendarResult{
		CalendarEvents: []*database.CalendarEvent{},
		Error:          err,
	}
}

func MarkEmailAsDone(api *API, userID primitive.ObjectID, emailID string) error {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")
	client := getGoogleHttpClient(externalAPITokenCollection, userID)

	var gmailService *gmail.Service
	if api.GoogleOverrideURLs.GmailModifyURL == nil {
		gmailService, err = gmail.New(client)
	} else {
		gmailService, err = gmail.NewService(
			context.Background(),
			option.WithoutAuthentication(),
			option.WithEndpoint(*api.GoogleOverrideURLs.GmailModifyURL))
	}

	if err != nil {
		log.Printf("Unable to create Gmail service: %v", err)
		return err
	}

	doneSetting, err := GetUserSetting(db, userID, SettingFieldEmailDonePreference)
	if err != nil {
		return err
	}
	var labelToRemove string
	switch *doneSetting {
	case ChoiceKeyArchive:
		labelToRemove = "INBOX"
	case ChoiceKeyMarkAsRead:
		labelToRemove = "UNREAD"
	default:
		log.Printf("Invalid done user setting: %s", *doneSetting)
		return err
	}

	_, err = gmailService.Users.Messages.Modify(
		"me",
		emailID,
		&gmail.ModifyMessageRequest{RemoveLabelIds: []string{labelToRemove}},
	).Do()

	return err
}

func ReplyToEmail(api *API, userID primitive.ObjectID, taskID primitive.ObjectID, body string) error {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")
	client := getGoogleHttpClient(externalAPITokenCollection, userID)

	var gmailService *gmail.Service

	if api.GoogleOverrideURLs.GmailReplyURL != nil {
		gmailService, err = gmail.NewService(
			context.Background(),
			option.WithoutAuthentication(),
			option.WithEndpoint(*api.GoogleOverrideURLs.GmailReplyURL),
		)
	} else {
		gmailService, err = gmail.NewService(context.TODO(), option.WithHTTPClient(client))
	}

	if err != nil {
		return err
	}

	var userObject database.User
	userCollection := db.Collection("users")
	err = userCollection.FindOne(context.TODO(), bson.D{{Key: "_id", Value: userID}}).Decode(&userObject)
	if err != nil {
		return err
	}

	var email database.Email
	taskCollection := db.Collection("tasks")
	err = taskCollection.FindOne(context.TODO(), bson.D{{Key: "_id", Value: taskID}, {Key: "user_id", Value: userID}}).Decode(&email)

	messageResponse, err := gmailService.Users.Messages.Get("me", email.IDExternal).Do()

	if err != nil {
		return err
	}

	subject := ""
	replyTo := ""
	from := ""
	smtpID := ""
	references := ""

	for _, h := range messageResponse.Payload.Headers {
		if h.Name == "Subject" {
			subject = h.Value
		} else if h.Name == "Reply-To" {
			replyTo = h.Value
		} else if h.Name == "From" {
			from = h.Value
		} else if h.Name == "References" {
			references = h.Value
		} else if h.Name == "Message-ID" {
			smtpID = h.Value
		}
	}

	var sendAddress string
	if len(replyTo) > 0 {
		sendAddress = replyTo
	} else {
		sendAddress = from
	}

	if len(smtpID) == 0 {
		return errors.New("missing smtp id")
	}

	if len(sendAddress) == 0 {
		return errors.New("missing send address")
	}

	if !strings.HasPrefix(subject, "Re:") {
		subject = "Re: " + subject
	}

	emailTo := "To: " + sendAddress + "\r\n"
	subject = "Subject: " + subject + "\n"
	emailFrom := fmt.Sprintf("From: %s <%s>\n", userObject.Name, userObject.Email)

	if len(references) > 0 {
		references = "References: " + references + " " + smtpID + "\n"
	} else {
		references = "References: " + smtpID + "\n"
	}
	inReply := "In-Reply-To: " + smtpID + "\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/plain; charset=\"UTF-8\";\n"
	msg := []byte(emailTo + emailFrom + subject + inReply + references + mime + "\n" + body)

	messageToSend := gmail.Message{
		Raw:      base64.URLEncoding.EncodeToString(msg),
		ThreadId: email.ThreadID,
	}

	_, err = gmailService.Users.Messages.Send("me", &messageToSend).Do()

	return err
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
