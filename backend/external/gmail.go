package external

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/settings"
	"github.com/GeneralTask/task-manager/backend/templating"
	"github.com/GeneralTask/task-manager/backend/utils"
	"github.com/cenkalti/backoff/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

const (
	fullFetchMaxResults = int64(500)
)

type GmailThreadResponse struct {
	Thread   *gmail.Thread
	ThreadID string
	Is404    bool
}

type GmailSource struct {
	Google GoogleService
}

type EmailContents struct {
	Recipients *database.Recipients
	Subject    string
	Body       string
}

func (gmailSource GmailSource) GetEmails(userID primitive.ObjectID, accountID string, historyID uint64, result chan<- EmailResult, fullRefresh bool) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
		return
	}
	defer dbCleanup()

	gmailService, err := createGmailService(gmailSource.Google.OverrideURLs.GmailFetchURL, db, userID, accountID, &gmailSource, parentCtx)
	if err != nil {
		log.Error().Err(err).Msg("unable to create Gmail service")
		result <- emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
		return
	}

	threadChannels := []chan *gmail.Thread{}
	var recentHistoryID uint64
	var historiesRequiringUpdate []*gmail.History
	// loads all thread changes, or 500 recent threads in the inbox
	// do fullRefresh if we don't have history data stored for the account
	if fullRefresh || historyID == 0 {
		log.Debug().Msg("Performing full gmail thread refresh")

		// get single history for historyID number (will be used in future inbox updates)
		historyResponse, err := gmailService.Users.History.List("me").MaxResults(1).StartHistoryId(1).Do()
		if err == nil {
			recentHistoryID = historyResponse.HistoryId
		}

		// TODO: for a full refresh, we probably want to paginate through this request until we've fetched all threads in the DB
		threadsResponse, err := gmailService.Users.Threads.List("me").MaxResults(fullFetchMaxResults).Do()
		if err != nil {
			log.Error().Err(err).Msg("failed to load Gmail threads for user")
			isBadToken := strings.Contains(err.Error(), "invalid_grant") ||
				strings.Contains(err.Error(), "authError")
			threadOutput := emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
			threadOutput.IsBadToken = isBadToken
			result <- threadOutput
			return
		}

		for _, threadListItem := range threadsResponse.Threads {
			var threadResult = make(chan *gmail.Thread)
			go getThreadFromGmail(gmailService, threadListItem.Id, threadResult)
			threadChannels = append(threadChannels, threadResult)
		}
	} else {
		log.Debug().Msg("Performing small gmail thread update/refresh")

		historiesRequiringUpdate, recentHistoryID, err = getAllRecentGmailHistory(gmailService, historyID)
		if err != nil {
			log.Error().Err(err).Msg("failed to load Gmail history for user")
			isBadToken := strings.Contains(err.Error(), "invalid_grant") ||
				strings.Contains(err.Error(), "authError")
			threadOutput := emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
			threadOutput.IsBadToken = isBadToken
		}

		// get all thread IDs mentioned in the history
		historyThreadIDs := []string{}
		netThreadEmailDelta := make(map[string]int)
		for _, historyEntry := range historiesRequiringUpdate {
			for _, message := range historyEntry.Messages {
				historyThreadIDs = append(historyThreadIDs, message.ThreadId)
			}
			for _, messageAdded := range historyEntry.MessagesAdded {
				if _, ok := netThreadEmailDelta[messageAdded.Message.ThreadId]; ok {
					netThreadEmailDelta[messageAdded.Message.ThreadId] += 1
				} else {
					netThreadEmailDelta[messageAdded.Message.ThreadId] = 1
				}
			}
			for _, messageDeleted := range historyEntry.MessagesDeleted {
				if _, ok := netThreadEmailDelta[messageDeleted.Message.ThreadId]; ok {
					netThreadEmailDelta[messageDeleted.Message.ThreadId] -= 1
				} else {
					netThreadEmailDelta[messageDeleted.Message.ThreadId] = -1
				}
			}
		}

		// dedupe the thread updates
		historyThreadIDs = removeDuplicateStr(historyThreadIDs)

		// handle thread deletion
		// TODO implement unit testing for this logic
		historyThreadIDsToFetch := handleThreadDeletion(db, userID, historyThreadIDs, netThreadEmailDelta)

		// get emails from the thread
		// TODO: think about not fetching emails if the only updates are label changes
		for _, threadListItem := range historyThreadIDsToFetch {
			var threadResult = make(chan *gmail.Thread)
			go getThreadFromGmail(gmailService, threadListItem, threadResult)
			threadChannels = append(threadChannels, threadResult)
		}
	}

	emailResult := createOrUpdateTaskFromThreads(userID, accountID, db, threadChannels)
	emailResult.HistoryID = recentHistoryID
	result <- emailResult
}

func createOrUpdateTaskFromThreads(userID primitive.ObjectID, accountID string, db *mongo.Database, threadChannels []chan *gmail.Thread) EmailResult {
	emails := []*database.Item{}

	for _, threadChannel := range threadChannels {
		thread := <-threadChannel

		var nestedEmails []database.Email
		var mostRecentEmailTimestamp primitive.DateTime

		threadItem := &database.Item{
			TaskBase: database.TaskBase{
				UserID:          userID,
				IDExternal:      thread.Id,
				IDTaskSection:   constants.IDTaskSectionDefault,
				SourceID:        TASK_SOURCE_ID_GMAIL,
				Deeplink:        fmt.Sprintf("https://mail.google.com/mail?authuser=%s#all/%s", accountID, thread.Id),
				SourceAccountID: accountID,
			},
			EmailThread: database.EmailThread{
				ThreadID:   thread.Id,
				IsArchived: isMessageArchived(thread.Messages[0]),
			},
			TaskType: database.TaskType{
				IsThread: true,
			},
		}
		// this database creation item should be before email parsing, otherwise we get duplicate _id errors in Mongo
		threadItem, err := database.GetOrCreateItem(db, userID, thread.Id, TASK_SOURCE_ID_GMAIL, threadItem)
		if err != nil {
			log.Error().Err(err).Msg("failed to get or create gmail thread")
			return emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
		}

		for _, message := range thread.Messages {
			emailItem, err := parseEmail(userID, accountID, message, thread.Id)
			// if we ran into an error parsing message body
			if err != nil {
				log.Error().Err(err).Msg("issue parsing gmail thread")
				return emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
			}

			dbEmail, err := database.UpdateOrCreateTask(
				db, userID, emailItem.IDExternal, emailItem.SourceID,
				emailItem, database.EmailItemToChangeable(emailItem),
				&[]bson.M{{"task_type.is_message": true}},
				true,
			)
			if err != nil {
				log.Error().Err(err).Msgf("could not update or create %+v", emailItem)
				return emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
			}

			emailItem.HasBeenReordered = dbEmail.HasBeenReordered
			emailItem.ID = dbEmail.ID
			emailItem.IDOrdering = dbEmail.IDOrdering
			emailItem.IDTaskSection = dbEmail.IDTaskSection

			timeSent := emailItem.Email.SentAt
			if timeSent > mostRecentEmailTimestamp {
				mostRecentEmailTimestamp = timeSent
			}

			nestedEmails = append(nestedEmails, emailItem.Email)
			emails = append(emails, emailItem)
		}

		// We can just check if the first email is archived because all emails in a thread have the same archive status.
		if len(thread.Messages) > 0 {
			threadItem.IsArchived = isMessageArchived(thread.Messages[0])
		}
		threadItem.EmailThread.LastUpdatedAt = mostRecentEmailTimestamp
		threadItem.EmailThread.Emails = assignOrGenerateNestedEmailIDs(threadItem, nestedEmails)

		_, err = database.UpdateOrCreateTask(
			db, userID, threadItem.IDExternal, threadItem.SourceID,
			threadItem, database.ThreadItemToChangeable(threadItem),
			&[]bson.M{{"task_type.is_thread": true}}, true)
		if err != nil {
			log.Error().Err(err).Msg("failed to update or create gmail thread")
			return emptyEmailResultWithSource(err, TASK_SOURCE_ID_GMAIL)
		}
	}

	return EmailResult{Emails: emails, Error: nil, SourceID: TASK_SOURCE_ID_GMAIL}
}

func parseEmail(userID primitive.ObjectID, accountID string, message *gmail.Message, threadID string) (*database.Item, error) {
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
			log.Error().Err(err).Msg("failed to parse message body")
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
		bodyParsed, err := parseMessagePartBody(message.Payload.MimeType, message.Payload.Body)
		if err != nil {
			return &database.Item{}, err
		}
		body = bodyParsed
	}

	senderName, senderEmail := utils.ExtractSenderName(sender)
	senderDomain := utils.ExtractEmailDomain(senderEmail)
	recipients := *GetRecipients(message.Payload.Headers)

	timeSent := primitive.NewDateTimeFromTime(time.Unix(message.InternalDate/1000, 0))
	email := database.Email{
		SMTPID:       smtpID,
		ThreadID:     threadID,
		EmailID:      message.Id,
		SenderDomain: senderDomain,
		SenderEmail:  senderEmail,
		SenderName:   senderName,
		Body:         *body,
		Subject:      title,
		ReplyTo:      replyTo,
		IsUnread:     isMessageUnread(message),
		Recipients:   recipients,
		SentAt:       timeSent,
	}
	emailItem := &database.Item{
		TaskBase: database.TaskBase{
			UserID:            userID,
			IDExternal:        message.Id,
			IDTaskSection:     constants.IDTaskSectionDefault,
			Sender:            senderName,
			SourceID:          TASK_SOURCE_ID_GMAIL,
			Deeplink:          fmt.Sprintf("https://mail.google.com/mail?authuser=%s#all/%s", accountID, threadID),
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
	return emailItem, nil
}

func getAllRecentGmailHistory(gmailService *gmail.Service, historyID uint64) ([]*gmail.History, uint64, error) {
	historyResponse, err := gmailService.Users.History.List("me").StartHistoryId(historyID).MaxResults(fullFetchMaxResults).Do()
	if err != nil {
		return []*gmail.History{}, 0, err
	}

	historiesRequiringUpdate := historyResponse.History

	// iterate through until we have the full history (no returned new entries)
	for len(historyResponse.History) > 0 {
		historiesRequiringUpdate = append(historiesRequiringUpdate, historyResponse.History...)
		currentHistoryID := historyResponse.History[len(historyResponse.History)-1].Id
		historyResponse, err = gmailService.Users.History.List("me").StartHistoryId(currentHistoryID).MaxResults(fullFetchMaxResults).Do()
		if err != nil {
			return []*gmail.History{}, 0, err
		}
	}

	return historiesRequiringUpdate, historyResponse.HistoryId, nil
}

func handleThreadDeletion(db *mongo.Database, userID primitive.ObjectID, historyThreadIDs []string, netThreadEmailDelta map[string]int) []string {
	threadsToFetch := []string{}
	for _, threadID := range historyThreadIDs {
		// if thread mentioned in additions/deletions, fetch, otherwise simply fetch updates
		if netThreadCount, ok := netThreadEmailDelta[threadID]; ok {
			dbThreadCount := getDBThreadCount(db, userID, threadID)

			// if error in db fetch, fetch thread regardless
			if dbThreadCount == -1 {
				continue
			}
			totalThreadCount := netThreadCount + dbThreadCount
			if totalThreadCount <= 0 {
				_, err := database.DeleteEmailThread(db, userID, threadID)
				if err != nil {
					log.Error().Err(err).Send()
				}
				continue
			}
		}
		threadsToFetch = append(threadsToFetch, threadID)
	}
	return threadsToFetch
}

func getDBThreadCount(db *mongo.Database, userID primitive.ObjectID, threadID string) int {
	thread, err := database.GetThread(db, userID, threadID)
	if err != nil {
		// ErrNoDocuments means that the filter did not match any documents in the collection
		if err == mongo.ErrNoDocuments {
			return 0
		}
		log.Error().Err(err).Send()
		// return -1 to signal error (not NoDocuments)
		return -1
	}
	return len(thread.Emails)
}

// from StackOverflow: https://stackoverflow.com/questions/66643946/how-to-remove-duplicates-strings-or-int-from-slice-in-go
func removeDuplicateStr(strSlice []string) []string {
	allKeys := make(map[string]bool)
	list := []string{}
	for _, item := range strSlice {
		if _, value := allKeys[item]; !value {
			allKeys[item] = true
			list = append(list, item)
		}
	}
	return list
}

func assignOrGenerateNestedEmailIDs(threadItem *database.Item, fetchedEmails []database.Email) []database.Email {
	emailIDToObjectID := make(map[string]primitive.ObjectID)
	for _, dbEmail := range threadItem.Emails {
		if dbEmail.MessageID != primitive.NilObjectID {
			emailIDToObjectID[dbEmail.EmailID] = dbEmail.MessageID
		}
	}
	for i := range fetchedEmails {
		if emailObjectID, ok := emailIDToObjectID[fetchedEmails[i].EmailID]; ok {
			fetchedEmails[i].MessageID = emailObjectID
		} else {
			fetchedEmails[i].MessageID = primitive.NewObjectID()
		}
	}
	return fetchedEmails
}

func getThreadFromGmail(gmailService *gmail.Service, threadID string, result chan<- *gmail.Thread) {
	getThreadCall := func() error {
		thread, err := gmailService.Users.Threads.Get("me", threadID).Do()
		if err != nil {
			return err
		}
		result <- thread
		return nil
	}
	notify := func(err error, ts time.Duration) {
		log.Debug().Err(err).Msgf("retrying threadID %s with backoff delay %+v", threadID, ts)
	}

	err := backoff.RetryNotify(getThreadCall, backoff.NewExponentialBackOff(), notify)
	if err != nil {
		log.Error().Err(err).Msgf("permanently failed to load threadID %s", threadID)
		result <- nil
		return
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

func isMessageArchived(message *gmail.Message) bool {
	for _, label := range message.LabelIds {
		if label == "INBOX" {
			return false
		}
	}
	return true
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
		log.Error().Err(err).Msg("failed to decode email body")
		return nil, err
	}

	bodyString := string(bodyData)

	if mimeType == "text/plain" {
		formattedBody, err := templating.FormatPlainTextAsHTML(bodyString)
		if err != nil {
			log.Error().Err(err).Msg("failed to decode email body")
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
		log.Error().Err(err).Msg("unable to create Gmail service")
		return err
	}

	doneSetting, err := settings.GetUserSetting(db, userID, settings.SettingFieldEmailDonePreference)
	if err != nil {
		log.Error().Err(err).Msg("failed to load user setting")
		return err
	}
	var labelToRemove string
	switch *doneSetting {
	case settings.ChoiceKeyArchive:
		labelToRemove = "INBOX"
	case settings.ChoiceKeyMarkAsRead:
		labelToRemove = "UNREAD"
	default:
		log.Error().Msgf("invalid done user setting: %s", *doneSetting)
		return err
	}

	message, err := gmailService.Users.Messages.Modify(
		"me",
		emailID,
		&gmail.ModifyMessageRequest{RemoveLabelIds: []string{labelToRemove}},
	).Do()
	log.Print("resulting message:", message)

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

func (gmailSource GmailSource) Reply(userID primitive.ObjectID, accountID string, messageID primitive.ObjectID, emailContents EmailContents) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()

	var userObject database.User
	userCollection := database.GetUserCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = userCollection.FindOne(dbCtx, bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		log.Error().Err(err).Msg("could not find user")
		return err
	}

	email, err := database.GetEmailFromMessageID(parentCtx, messageID, userID)
	if err != nil {
		log.Error().Err(err).Msg("could not find message in DB")
		return err
	}

	gmailService, err := createGmailService(gmailSource.Google.OverrideURLs.GmailSendURL, db, userID, accountID, &gmailSource, parentCtx)
	if err != nil {
		return err
	}
	messageResponse, err := gmailService.Users.Messages.Get("me", email.EmailID).Do()
	if err != nil {
		log.Error().Err(err).Msg("could not get message from gmail")
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
		recipientHeader = "To: " + createEmailRecipientHeader(emailContents.Recipients.To) + "\r\n"
		if len(emailContents.Recipients.Cc) > 0 {
			recipientHeader += "Cc: " + createEmailRecipientHeader(emailContents.Recipients.Cc) + "\r\n"
		}
		if len(emailContents.Recipients.Bcc) > 0 {
			recipientHeader += "Bcc: " + createEmailRecipientHeader(emailContents.Recipients.Bcc) + "\r\n"
		}
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
		ThreadId: email.ThreadID,
	}

	_, err = gmailService.Users.Messages.Send("me", &messageToSend).Do()

	return err
}

func (gmailSource GmailSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	return primitive.NilObjectID, errors.New("has not been implemented yet")
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
		log.Error().Err(err).Msg("unable to create Gmail service")
		return err
	}

	if updateFields.IsUnread != nil {
		err = changeLabelOnMessage(gmailService, emailID, "UNREAD", *updateFields.IsUnread)
	}

	return err
}

func (gmailSource GmailSource) ModifyThread(userID primitive.ObjectID, accountID string, threadID primitive.ObjectID, isUnread *bool, IsArchived *bool) error {
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
	if IsArchived != nil {
		err = changeLabelsOnEmailsInThread(gmailService, &threadItem, "INBOX", !*IsArchived)
	}
	return err
}

func changeLabelsOnEmailsInThread(gmailService *gmail.Service, threadItem *database.Item, labelToChange string, addLabel bool) error {
	var err error
	for _, email := range threadItem.EmailThread.Emails {
		err = changeLabelOnMessage(gmailService, email.EmailID, labelToChange, addLabel)
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
	log.Debug().Msgf("resulting message: %+v", message)

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
	recipientsString = strings.TrimSpace(recipientsString)
	if recipientsString == "" {
		return []database.Recipient{}
	}
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
		if client == nil {
			log.Printf("failed to fetch google API token")
			return nil, errors.New("failed to fetch google API token")
		}
		gmailService, err = gmail.NewService(extCtx, option.WithHTTPClient(client))
	}
	if err != nil {
		return nil, err
	}

	return gmailService, nil
}
