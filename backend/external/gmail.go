package external

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/settings"
	"github.com/GeneralTask/task-manager/backend/templating"
	"github.com/GeneralTask/task-manager/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

type GmailSource struct {
	Google GoogleService
}

type EmailContents struct {
	To      string
	Subject string
	Body    string
}

func (Gmail GmailSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult) {
	parentCtx := context.Background()
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

	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	client := GetGoogleHttpClient(externalAPITokenCollection, userID, accountID)
	if client == nil {
		log.Printf("failed to fetch google API token")
		result <- emptyEmailResult(errors.New("failed to fetch google API token"))
		return
	}

	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	gmailService, err := gmail.NewService(extCtx, option.WithHTTPClient(client))
	if err != nil {
		log.Printf("unable to create Gmail service: %v", err)
		result <- emptyEmailResult(err)
		return
	}

	threadsResponse, err := gmailService.Users.Threads.List("me").Q("label:inbox is:unread").Do()
	if err != nil {
		log.Printf("failed to load Gmail threads for user: %v", err)
		result <- emptyEmailResult(err)
		return
	}
	for _, threadListItem := range threadsResponse.Threads {
		thread, err := gmailService.Users.Threads.Get("me", threadListItem.Id).Do()
		if err != nil {
			log.Printf("failed to load thread: %v", err)
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
			var bodyPlain *string

			var messageParts []*gmail.MessagePart
			for _, messagePart := range message.Payload.Parts {
				if messagePart.MimeType[:9] == "multipart" {
					messageParts = append(messageParts, messagePart.Parts...)
					continue
				}
				messageParts = append(messageParts, messagePart)
			}
			for _, messagePart := range messageParts {
				parsedBody, err := parseMessagePartBody(messagePart.MimeType, messagePart.Body)
				if err != nil {
					log.Printf("failed to parse message body: %v", err)
					continue
				}
				if messagePart.MimeType == "text/html" {
					body = parsedBody
					break
				}
				if messagePart.MimeType == "text/plain" && bodyPlain == nil {
					bodyPlain = parsedBody
				}
			}
			// first fallback on first text/plain parsed body
			if body == nil && bodyPlain != nil {
				body = bodyPlain
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
					UserID:          userID,
					IDExternal:      message.Id,
					IDTaskSection:   constants.IDTaskSectionToday,
					Sender:          senderName,
					SourceID:        TASK_SOURCE_ID_GMAIL,
					Deeplink:        fmt.Sprintf("https://mail.google.com/mail?authuser=%s#all/%s", userObject.Email, threadListItem.Id),
					Title:           title,
					Body:            *body,
					TimeAllocation:  timeAllocation.Nanoseconds(),
					SourceAccountID: accountID,
				},
				SenderDomain: senderDomain,
				ThreadID:     threadListItem.Id,
				TimeSent:     primitive.NewDateTimeFromTime(time.Unix(message.InternalDate/1000, 0)),
			}
			dbEmail, err := database.GetOrCreateTask(db, userID, email.IDExternal, email.SourceID, email)
			if err != nil {
				result <- emptyEmailResult(err)
				return
			}
			if dbEmail != nil {
				email.ID = dbEmail.ID
				email.IDOrdering = dbEmail.IDOrdering
				email.IDTaskSection = dbEmail.IDTaskSection
			}
			emails = append(emails, email)
		}
	}
	result <- EmailResult{Emails: emails, Error: nil}
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
		log.Printf("failed to decode email body: %v", err)
		return nil, err
	}

	bodyString := string(bodyData)

	if mimeType == "text/plain" {
		formattedBody, err := templating.FormatPlainTextAsHTML(bodyString)
		if err != nil {
			log.Printf("failed to decode email body: %v", err)
			return nil, err
		} else {
			bodyString = formattedBody
		}
	}

	return &bodyString, nil
}

func (Gmail GmailSource) GetEvents(userID primitive.ObjectID, accountID string, timezoneOffsetMinutes int, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (Gmail GmailSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	result <- emptyTaskResult(nil)
}

func (Gmail GmailSource) MarkAsDone(userID primitive.ObjectID, accountID string, emailID string) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	client := GetGoogleHttpClient(externalAPITokenCollection, userID, accountID)

	var gmailService *gmail.Service
	if Gmail.Google.OverrideURLs.GmailModifyURL == nil {
		gmailService, err = gmail.New(client)
	} else {
		extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		gmailService, err = gmail.NewService(
			extCtx,
			option.WithoutAuthentication(),
			option.WithEndpoint(*Gmail.Google.OverrideURLs.GmailModifyURL))
	}

	if err != nil {
		log.Printf("unable to create Gmail service: %v", err)
		return err
	}

	doneSetting, err := settings.GetUserSetting(db, userID, settings.SettingFieldEmailDonePreference)
	if err != nil {
		return err
	}
	var labelToRemove string
	switch *doneSetting {
	case settings.ChoiceKeyArchive:
		labelToRemove = "INBOX"
	case settings.ChoiceKeyMarkAsRead:
		labelToRemove = "UNREAD"
	default:
		log.Printf("invalid done user setting: %s", *doneSetting)
		return err
	}

	_, err = gmailService.Users.Messages.Modify(
		"me",
		emailID,
		&gmail.ModifyMessageRequest{RemoveLabelIds: []string{labelToRemove}},
	).Do()

	return err
}

func (Gmail GmailSource) SendEmail(userID primitive.ObjectID, accountID string, email EmailContents) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	client := GetGoogleHttpClient(externalAPITokenCollection, userID, accountID)

	var gmailService *gmail.Service

	if Gmail.Google.OverrideURLs.GmailSendURL != nil {
		extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		gmailService, err = gmail.NewService(
			extCtx,
			option.WithoutAuthentication(),
			option.WithEndpoint(*Gmail.Google.OverrideURLs.GmailSendURL),
		)
	} else {
		extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		gmailService, err = gmail.NewService(extCtx, option.WithHTTPClient(client))
	}

	if err != nil {
		return err
	}

	var userObject database.User
	userCollection := database.GetUserCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = userCollection.FindOne(dbCtx, bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		return err
	}

	if err != nil {
		return err
	}

	sendAddress := email.To
	subject := email.Subject
	body := email.Body

	if len(sendAddress) == 0 {
		return errors.New("missing send address")
	}

	emailTo := "To: " + sendAddress + "\r\n"
	subject = "Subject: " + subject + "\n"
	emailFrom := fmt.Sprintf("From: %s <%s>\n", userObject.Name, userObject.Email)

	msg := []byte(emailTo + emailFrom + subject + "\n" + body)

	messageToSend := gmail.Message{
		Raw: base64.URLEncoding.EncodeToString(msg),
	}

	_, err = gmailService.Users.Messages.Send("me", &messageToSend).Do()

	return err
}

func (Gmail GmailSource) Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, body string) error {
	log.Println("REPLY BODY:", body)
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	log.Println("userID:", userID, "accountID:", accountID)
	client := GetGoogleHttpClient(externalAPITokenCollection, userID, accountID)

	var gmailService *gmail.Service

	if Gmail.Google.OverrideURLs.GmailReplyURL != nil {
		extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		gmailService, err = gmail.NewService(
			extCtx,
			option.WithoutAuthentication(),
			option.WithEndpoint(*Gmail.Google.OverrideURLs.GmailReplyURL),
		)
	} else {
		extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		gmailService, err = gmail.NewService(extCtx, option.WithHTTPClient(client))
	}

	if err != nil {
		return err
	}

	var userObject database.User
	userCollection := database.GetUserCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = userCollection.FindOne(dbCtx, bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		return err
	}

	var email database.Email
	taskCollection := database.GetTaskCollection(db)
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = taskCollection.FindOne(dbCtx, bson.M{"$and": []bson.M{{"_id": taskID}, {"user_id": userID}}}).Decode(&email)
	if err != nil {
		return err
	}

	log.Println("email ID external:", email.IDExternal, email)
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
		log.Println("message headers:", h.Name, h.Value, h)
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
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n"
	msg := []byte(emailTo + emailFrom + subject + inReply + references + mime + "\n" + body)

	messageToSend := gmail.Message{
		Raw:      base64.URLEncoding.EncodeToString(msg),
		ThreadId: email.ThreadID,
	}

	_, err = gmailService.Users.Messages.Send("me", &messageToSend).Do()

	return err
}

func (Gmail GmailSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	return errors.New("Has not been implemented yet")
}
