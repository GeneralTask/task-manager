package api

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"github.com/GeneralTask/task-manager/backend/external"

	"go.mongodb.org/mongo-driver/bson"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

func ReplyToEmail(api *API, userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, body string) error {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")
	client := external.GetGoogleHttpClient(externalAPITokenCollection, userID, accountID)

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
	err = userCollection.FindOne(context.TODO(), bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		return err
	}

	var email database.Email
	taskCollection := db.Collection("tasks")
	err = taskCollection.FindOne(context.TODO(), bson.M{"$and": []bson.M{{"_id": taskID}, {"user_id": userID}}}).Decode(&email)
	if err != nil {
		return err
	}

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
