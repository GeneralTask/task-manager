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
	"github.com/chidiwilliams/flatbson"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

type GmailSource struct {
	Google GoogleService
}

type EmailContents struct {
	Recipients *database.Recipients
	Subject    string
	Body       string
}

func (gmailSource GmailSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
		return
	}
	defer dbCleanup()

	emails := []*database.Item{}

	client := getGoogleHttpClient(db, userID, accountID)
	if client == nil {
		log.Printf("failed to fetch google API token")
		result <- emptyEmailResultWithSource(errors.New("failed to fetch google API token"), TASK_SOURCE_ID_GMAIL)
		return
	}

	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	gmailService, err := gmail.NewService(extCtx, option.WithHTTPClient(client))
	if err != nil {
		log.Printf("unable to create Gmail service: %v", err)
		result <- emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
		return
	}

	// loads the most recent 100 threads in the inbox
	threadsResponse, err := gmailService.Users.Threads.List("me").Q("label:inbox").Do()
	if err != nil {
		log.Printf("failed to load Gmail threads for user: %v", err)
		isBadToken := strings.Contains(err.Error(), "invalid_grant")
		result <- EmailResult{
			Emails:     []*database.Item{},
			Error:      err,
			IsBadToken: isBadToken,
			SourceID:   TASK_SOURCE_ID_GMAIL,
		}
		return
	}
	threadChannels := []chan *gmail.Thread{}
	for _, threadListItem := range threadsResponse.Threads {
		var threadResult = make(chan *gmail.Thread)
		go getThreadFromGmail(gmailService, threadListItem.Id, threadResult)
		threadChannels = append(threadChannels, threadResult)
	}
	for _, threadChannel := range threadChannels {
		thread := <-threadChannel
		if thread == nil {
			log.Printf("failed to load thread: %v", err)
			result <- emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
			return
		}

		var nestedEmails []database.Email
		var mostRecentEmailTimestamp primitive.DateTime
		threadItem := &database.Item{
			TaskBase: database.TaskBase{
				UserID:          userID,
				IDExternal:      thread.Id,
				IDTaskSection:   constants.IDTaskSectionToday,
				SourceID:        TASK_SOURCE_ID_GMAIL,
				Deeplink:        fmt.Sprintf("https://mail.google.com/mail?authuser=%s#all/%s", accountID, thread.Id),
				SourceAccountID: accountID,
			},
			EmailThread: database.EmailThread{
				ThreadID: thread.Id,
			},
			TaskType: database.TaskType{
				IsThread: true,
			},
		}
		threadItem, err := database.GetOrCreateItem(db, userID, thread.Id, TASK_SOURCE_ID_GMAIL, threadItem)

		for _, message := range thread.Messages {
			sender := ""
			replyTo := ""
			title := ""
			smtpID := ""
			for _, header := range message.Payload.Headers {
				if header.Name == "From" {
					sender = header.Value
				} else if header.Name == "Reply-To" {
					replyTo = header.Value
				} else if header.Name == "Subject" {
					title = header.Value
				} else if header.Name == "Message-ID" || header.Name == "Message-Id" {
					smtpID = header.Value
				}
			}
			var body *string
			var bodyPlain *string

			messageParts := expandMessageParts(message.Payload.Parts)
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
					result <- emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
					return
				}
			}

			senderName, senderEmail := utils.ExtractSenderName(sender)
			senderDomain := utils.ExtractEmailDomain(senderEmail)

			timeSent := primitive.NewDateTimeFromTime(time.Unix(message.InternalDate/1000, 0))

			recipients := *GetRecipients(message.Payload.Headers)

			if timeSent > mostRecentEmailTimestamp {
				mostRecentEmailTimestamp = timeSent
			}
			email := database.Email{
				SMTPID:       smtpID,
				ThreadID:     thread.Id,
				EmailID:      message.Id,
				SenderDomain: senderDomain,
				SenderEmail:  senderEmail,
				SenderName:   senderName,
				Body:         *body,
				Subject:      title,
				ReplyTo:      replyTo,
				IsUnread:     isMessageUnread(message),
				Recipients:   recipients,
			}
			nestedEmails = append(nestedEmails, email)
			emailItem := &database.Item{
				TaskBase: database.TaskBase{
					UserID:            userID,
					IDExternal:        message.Id,
					IDTaskSection:     constants.IDTaskSectionToday,
					Sender:            senderName,
					SourceID:          TASK_SOURCE_ID_GMAIL,
					Deeplink:          fmt.Sprintf("https://mail.google.com/mail?authuser=%s#all/%s", accountID, thread.Id),
					Title:             title,
					Body:              *body,
					SourceAccountID:   accountID,
					CreatedAtExternal: timeSent,
				},
				Email: email,
				TaskType: database.TaskType{
					IsMessage: true,
				},
			}

			dbEmail, err := createOrUpdateGmailEmail(db, userID, emailItem)
			if err != nil {
				log.Printf("failed to update or create gmail email: %v", err)
				result <- emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
				return
			}
			emailItem.HasBeenReordered = dbEmail.HasBeenReordered
			emailItem.TaskBase.ID = dbEmail.TaskBase.ID
			emailItem.IDOrdering = dbEmail.IDOrdering
			emailItem.IDTaskSection = dbEmail.IDTaskSection
			emails = append(emails, emailItem)
		}

		threadItem.EmailThread.LastUpdatedAt = mostRecentEmailTimestamp
		threadItem.EmailThread.Emails = nestedEmails
		updateThreadEmails(threadItem, &nestedEmails)
		err = createOrUpdateGmailThread(db, userID, threadItem)
		if err != nil {
			log.Printf("failed to update or create gmail thread: %v", err)
			result <- emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
			return
		}
	}
	result <- EmailResult{Emails: emails, Error: nil, SourceID: TASK_SOURCE_ID_GMAIL}
}

func updateThreadEmails(threadItem *database.Item, fetchedEmails *[]database.Email) {
	emailIDToObjectID := make(map[string]primitive.ObjectID)
	for _, dbEmail := range threadItem.Emails {
		emailIDToObjectID[dbEmail.EmailID] = dbEmail.ID
	}

	for i, _ := range *fetchedEmails {
		if emailObjectID, ok := emailIDToObjectID[(*fetchedEmails)[i].EmailID]; ok {
			(*fetchedEmails)[i].ID = emailObjectID
		} else {
			(*fetchedEmails)[i].ID = primitive.NewObjectID()
		}
	}

	threadItem.EmailThread.Emails = *fetchedEmails
}

func createOrUpdateGmailThread(db *mongo.Database, userID primitive.ObjectID, threadItem *database.Item) error {
	gmailUpdateableFields := database.ThreadItemToChangeable(threadItem)

	// We flatten in order to do partial updates of nested documents correctly in mongodb
	flattenedThreadItem, err := flatbson.Flatten(threadItem)
	if err != nil {
		log.Printf("Could not flatten %+v, error: %+v", threadItem, err)
		return err
	}
	flattenedThreadUpdateable, err := flatbson.Flatten(gmailUpdateableFields)
	if err != nil {
		log.Printf("Could not flatten %+v, error: %+v", gmailUpdateableFields, err)
		return err
	}
	res, err := database.UpdateOrCreateTask(
		db, userID, threadItem.IDExternal, threadItem.SourceID,
		flattenedThreadItem, flattenedThreadUpdateable,
		&[]bson.M{{"task_type.is_thread": true}},
	)
	if err != nil {
		return err
	}
	var dbThread database.Item
	err = res.Decode(&dbThread)
	if err != nil {
		log.Printf("failed to update or create gmail thread: %v", err)
		return err
	}

	return nil
}

func createOrUpdateGmailEmail(db *mongo.Database, userID primitive.ObjectID, emailItem *database.Item) (*database.Item, error) {
	gmailUpdateableFields := database.EmailItemToChangeable(emailItem)

	// We flatten in order to do partial updates of nested documents correctly in mongodb
	flattenedEmail, err := flatbson.Flatten(emailItem)
	if err != nil {
		log.Printf("Could not flatten %+v, error: %+v", emailItem, err)
		return nil, err
	}
	flattenedGmailUpdateable, err := flatbson.Flatten(gmailUpdateableFields)
	if err != nil {
		log.Printf("Could not flatten %+v, error: %+v", gmailUpdateableFields, err)
		return nil, err
	}
	res, err := database.UpdateOrCreateTask(
		db, userID, emailItem.IDExternal,
		emailItem.SourceID, flattenedEmail, flattenedGmailUpdateable,
		&[]bson.M{{"task_type.is_message": true}},
	)
	if err != nil {
		return nil, err
	}

	var dbEmail database.Item
	err = res.Decode(&dbEmail)
	if err != nil {
		log.Printf("failed to update or create gmail email: %v", err)
		return nil, err
	}

	return &dbEmail, nil
}

func getThreadFromGmail(gmailService *gmail.Service, threadID string, result chan<- *gmail.Thread) {
	thread, err := gmailService.Users.Threads.Get("me", threadID).Do()
	if err != nil {
		log.Printf("failed to load thread: %v", err)
		result <- nil
		return
	}
	result <- thread
}

func isMessageUnread(message *gmail.Message) bool {
	for _, label := range message.LabelIds {
		if label == "UNREAD" {
			return true
		}
	}
	return false
}

func expandMessageParts(parts []*gmail.MessagePart) []*gmail.MessagePart {
	var messageParts []*gmail.MessagePart
	for _, messagePart := range parts {
		if messagePart.MimeType[:9] == "multipart" {
			messageParts = append(messageParts, expandMessageParts(messagePart.Parts)...)
			continue
		}
		messageParts = append(messageParts, messagePart)
	}
	return messageParts
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

func (gmailSource GmailSource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (gmailSource GmailSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	result <- emptyTaskResult(nil)
}

func (gmailSource GmailSource) GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil)
}

func (gmailSource GmailSource) MarkAsDone(userID primitive.ObjectID, accountID string, emailID string) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	client := getGoogleHttpClient(db, userID, accountID)

	var gmailService *gmail.Service
	if gmailSource.Google.OverrideURLs.GmailModifyURL == nil {
		extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		gmailService, err = gmail.NewService(extCtx, option.WithHTTPClient(client))
	} else {
		extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		gmailService, err = gmail.NewService(
			extCtx,
			option.WithoutAuthentication(),
			option.WithEndpoint(*gmailSource.Google.OverrideURLs.GmailModifyURL))
	}

	if err != nil {
		log.Printf("unable to create Gmail service: %v", err)
		return err
	}

	doneSetting, err := settings.GetUserSetting(db, userID, settings.SettingFieldEmailDonePreference)
	if err != nil {
		log.Printf("failed to load user setting: %s", err)
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

	message, err := gmailService.Users.Messages.Modify(
		"me",
		emailID,
		&gmail.ModifyMessageRequest{RemoveLabelIds: []string{labelToRemove}},
	).Do()
	log.Println("resulting message:", message)

	return err
}

func (gmailSource GmailSource) SendEmail(userID primitive.ObjectID, accountID string, email EmailContents) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()

	gmailService, err := createGmailService(gmailSource.Google.OverrideURLs.GmailSendURL, db, userID, accountID, &gmailSource, parentCtx)
	if err != nil {
		return err
	}
	userObject, err := database.GetUser(db, userID)
	if err != nil {
		return err
	}

	if len(email.Recipients.To) == 0 {
		return errors.New("missing send address")
	}

	subject := email.Subject
	body := email.Body

	emailTo := "To: " + createEmailRecipientHeader(email.Recipients.To) + "\r\n"
	emailCc := "Cc: " + createEmailRecipientHeader(email.Recipients.Cc) + "\r\n"
	EmailBcc := "Bcc: " + createEmailRecipientHeader(email.Recipients.Bcc) + "\r\n"
	subject = "Subject: " + subject + "\n"
	emailFrom := fmt.Sprintf("From: %s <%s>\n", userObject.Name, userObject.Email)

	msg := []byte(emailTo + emailCc + EmailBcc + emailFrom + subject + "\n" + body)

	messageToSend := gmail.Message{
		Raw: base64.URLEncoding.EncodeToString(msg),
	}

	_, err = gmailService.Users.Messages.Send("me", &messageToSend).Do()

	return err
}

func (gmailSource GmailSource) Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, emailContents EmailContents) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	client := getGoogleHttpClient(db, userID, accountID)

	var gmailService *gmail.Service

	if gmailSource.Google.OverrideURLs.GmailReplyURL != nil {
		extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		gmailService, err = gmail.NewService(
			extCtx,
			option.WithoutAuthentication(),
			option.WithEndpoint(*gmailSource.Google.OverrideURLs.GmailReplyURL),
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

	var email database.Item
	taskCollection := database.GetTaskCollection(db)
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = taskCollection.FindOne(dbCtx, bson.M{"$and": []bson.M{{"_id": taskID}, {"user_id": userID}}}).Decode(&email)
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
		} else if h.Name == "Message-ID" || h.Name == "Message-Id" {
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

	var recipientHeader string
	if emailContents.Recipients != nil {
		emailTo := "To: " + createEmailRecipientHeader(emailContents.Recipients.To) + "\r\n"
		emailCc := "Cc: " + createEmailRecipientHeader(emailContents.Recipients.Cc) + "\r\n"
		emailBcc := "Bcc: " + createEmailRecipientHeader(emailContents.Recipients.Bcc) + "\r\n"
		recipientHeader = emailTo + emailCc + emailBcc
	} else {
		// For backwards compatibility - TODO remove this after frontend migrates to messages/compose endpoint
		emailTo := "To: " + sendAddress + "\r\n"
		recipientHeader = emailTo
	}

	subject = "Subject: " + subject + "\n"
	emailFrom := fmt.Sprintf("From: %s <%s>\n", userObject.Name, userObject.Email)

	if len(references) > 0 {
		references = "References: " + references + " " + smtpID + "\n"
	} else {
		references = "References: " + smtpID + "\n"
	}
	inReply := "In-Reply-To: " + smtpID + "\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n"
	msg := []byte(recipientHeader + emailFrom + subject + inReply + references + mime + "\n" + emailContents.Body)

	messageToSend := gmail.Message{
		Raw:      base64.URLEncoding.EncodeToString(msg),
		ThreadId: email.Email.ThreadID,
	}

	_, err = gmailService.Users.Messages.Send("me", &messageToSend).Do()

	return err
}

func (gmailSource GmailSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	return errors.New("has not been implemented yet")
}

func (gmailSource GmailSource) CreateNewEvent(userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (gmailSource GmailSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskChangeableFields) error {
	if updateFields.IsCompleted != nil && *updateFields.IsCompleted {
		gmailSource.MarkAsDone(userID, accountID, issueID)
	}
	return nil
}

func (gmailSource GmailSource) ModifyMessage(userID primitive.ObjectID, accountID string, emailID string, updateFields *database.MessageChangeable) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	client := getGoogleHttpClient(db, userID, accountID)

	var gmailService *gmail.Service
	if gmailSource.Google.OverrideURLs.GmailModifyURL == nil {
		extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		gmailService, err = gmail.NewService(extCtx, option.WithHTTPClient(client))
	} else {
		extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		gmailService, err = gmail.NewService(
			extCtx,
			option.WithoutAuthentication(),
			option.WithEndpoint(*gmailSource.Google.OverrideURLs.GmailModifyURL))
	}

	if err != nil {
		log.Printf("unable to create Gmail service: %v", err)
		return err
	}

	if updateFields.IsUnread != nil {
		err = changeLabelOnMessage(gmailService, emailID, "UNREAD", *updateFields.IsUnread)
	}

	return err
}

func (gmailSource GmailSource) ModifyThread(userID primitive.ObjectID, accountID string, threadID primitive.ObjectID, isUnread *bool) error {
	// todo - mark all emails in the thread as read
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()

	gmailService, err := createGmailService(gmailSource.Google.OverrideURLs.GmailModifyURL, db, userID, accountID, &gmailSource, parentCtx)
	if err != nil {
		return err
	}

	var threadItem database.Item
	taskCollection := database.GetTaskCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = taskCollection.FindOne(dbCtx, bson.M{"$and": []bson.M{{"_id": threadID}, {"user_id": userID}}}).Decode(&threadItem)
	if err != nil {
		return err
	}

	if isUnread != nil {
		err = changeLabelsOnEmailsInThread(gmailService, &threadItem, "UNREAD", *isUnread)
	}
	return err
}

func changeLabelsOnEmailsInThread(gmailService *gmail.Service, threadItem *database.Item, labelToChange string, addLabel bool) error {
	var err error
	for _, email := range threadItem.EmailThread.Emails {
		err = changeLabelOnMessage(gmailService, email.EmailID, "UNREAD", addLabel)
		if err != nil {
			return err
		}
	}
	return nil
}

func changeLabelOnMessage(gmailService *gmail.Service, emailID string, labelToChange string, addLabel bool) error {
	var modifyRequest gmail.ModifyMessageRequest
	if addLabel {
		modifyRequest.AddLabelIds = []string{labelToChange}
	} else {
		modifyRequest.RemoveLabelIds = []string{labelToChange}
	}
	message, err := gmailService.Users.Messages.Modify(
		"me",
		emailID,
		&modifyRequest,
	).Do()
	log.Println("resulting message:", message)

	return err
}

func GetRecipients(headers []*gmail.MessagePartHeader) *database.Recipients {
	emptyRecipients := []database.Recipient{}
	// to make lists are empty instead of nil
	recipients := database.Recipients{
		To:  emptyRecipients,
		Cc:  emptyRecipients,
		Bcc: emptyRecipients,
	}
	for _, header := range headers {
		if header.Name == "To" {
			recipients.To = parseRecipients(header.Value)
		} else if header.Name == "Cc" {
			recipients.Cc = parseRecipients(header.Value)
		} else if header.Name == "Bcc" {
			recipients.Bcc = parseRecipients(header.Value)
		}
	}
	return &recipients
}

// accepts recipients in form: `"Recipient Name" <recipient@email.com>, "Recipient 2 Name" <recipient2@email.com>`
// adds to recipients parameter
func parseRecipients(recipientsString string) []database.Recipient {
	split := strings.Split(recipientsString, ",")
	recipients := []database.Recipient{}
	for _, s := range split {
		s = strings.TrimSpace(s)
		recipient := database.Recipient{}
		if strings.Contains(s, "<") {
			if strings.Contains(s, "<") {
				recipient.Email = strings.Split(s, "<")[1]
			}
			recipient.Email = strings.Trim(recipient.Email, "> ")
			recipient.Name = strings.Split(s, "<")[0]
			recipient.Name = strings.Trim(recipient.Name, "\" ")
		} else {
			recipient.Email = s
		}
		recipients = append(recipients, recipient)
	}
	return recipients
}

func createEmailRecipientHeader(recipients []database.Recipient) string {
	recipientStrings := []string{}
	for _, recipient := range recipients {
		recipientStrings = append(recipientStrings, recipientToString(recipient))
	}
	return strings.Join(recipientStrings, ",")
}

func recipientToString(recipient database.Recipient) string {
	if len(recipient.Name) > 0 {
		return fmt.Sprintf("%s <%s>", recipient.Name, recipient.Email)
	} else {
		return recipient.Email
	}
}

func createGmailService(overrideURL *string, db *mongo.Database, userID primitive.ObjectID, accountID string, gmailSource *GmailSource, ctx context.Context) (*gmail.Service, error) {
	var gmailService *gmail.Service
	var err error
	if overrideURL != nil {
		extCtx, cancel := context.WithTimeout(ctx, constants.ExternalTimeout)
		defer cancel()
		gmailService, err = gmail.NewService(
			extCtx,
			option.WithoutAuthentication(),
			option.WithEndpoint(*overrideURL),
		)
	} else {
		extCtx, cancel := context.WithTimeout(ctx, constants.ExternalTimeout)
		defer cancel()
		client := getGoogleHttpClient(db, userID, accountID)
		gmailService, err = gmail.NewService(extCtx, option.WithHTTPClient(client))
	}
	if err != nil {
		return nil, err
	}

	return gmailService, nil
}
