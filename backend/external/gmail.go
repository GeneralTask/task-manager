package external

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/settings"
	"github.com/GeneralTask/task-manager/backend/templating"
	"github.com/GeneralTask/task-manager/backend/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

type GmailSource struct {
	Google GoogleService
}

func (Gmail GmailSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult) {
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

	externalAPITokenCollection := db.Collection("external_api_tokens")
	client := GetGoogleHttpClient(externalAPITokenCollection, userID, accountID)
	if client == nil {
		log.Printf("failed to fetch google API token")
		result <- emptyEmailResult(errors.New("failed to fetch google API token"))
		return
	}

	gmailService, err := gmail.NewService(context.TODO(), option.WithHTTPClient(client))
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
					UserID:          userID,
					IDExternal:      message.Id,
					IDTaskSection:   constants.IDTaskSectionToday,
					Sender:          senderName,
					Source:          database.TaskSourceGmail,
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
			dbEmail, err := database.GetOrCreateTask(db, userID, email.IDExternal, email.Source, email)
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

func (Gmail GmailSource) MarkAsDone(userID primitive.ObjectID, accountID string, emailID string) error {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")
	client := GetGoogleHttpClient(externalAPITokenCollection, userID, accountID)

	var gmailService *gmail.Service
	if Gmail.Google.OverrideURLs.GmailModifyURL == nil {
		gmailService, err = gmail.New(client)
	} else {
		gmailService, err = gmail.NewService(
			context.Background(),
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
