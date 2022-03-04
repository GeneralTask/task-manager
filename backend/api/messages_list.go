package api

import (
	"context"
	"fmt"
	"log"
	"sort"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/settings"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type messageSource struct {
	AccountId     string `json:"account_id"`
	Name          string `json:"name"`
	Logo          string `json:"logo"`
	IsCompletable bool   `json:"is_completable"`
	IsReplyable   bool   `json:"is_replyable"`
}

type message struct {
	ID         primitive.ObjectID `json:"id"`
	Title      string             `json:"title"`
	Deeplink   string             `json:"deeplink"`
	Body       string             `json:"body"`
	Sender     string             `json:"sender"`
	Recipients Recipients         `json:"recipients"`
	SentAt     string             `json:"sent_at"`
	IsUnread   bool               `json:"is_unread"`
	Source     messageSource      `json:"source"`
}

func (api *API) MessagesList(c *gin.Context) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}

	defer dbCleanup()
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	userID, _ := c.Get("user")
	var userObject database.User
	userCollection := database.GetUserCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = userCollection.FindOne(dbCtx, bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		log.Printf("failed to find user: %v", err)
		Handle500(c)
		return
	}

	currentEmails, err := database.GetUnreadEmails(db, userID.(primitive.ObjectID))
	if err != nil {
		Handle500(c)
		return
	}

	var tokens []database.ExternalAPIToken
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := externalAPITokenCollection.Find(
		dbCtx,
		bson.M{"user_id": userID},
	)
	if err != nil {
		log.Printf("failed to fetch api tokens: %v", err)
		Handle500(c)
		return
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tokens)
	if err != nil {
		log.Printf("failed to iterate through api tokens: %v", err)
		Handle500(c)
		return
	}

	emailChannels := []chan external.EmailResult{}
	tokensInUse := []*database.ExternalAPIToken{}
	// Loop through linked accounts and fetch relevant items
	for index, token := range tokens {
		taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(token.ServiceID)
		if err != nil {
			log.Printf("error loading task service: %v", err)
			Handle500(c)
			return
		}
		for _, taskSource := range taskServiceResult.Sources {
			var emails = make(chan external.EmailResult)
			go taskSource.GetEmails(userID.(primitive.ObjectID), token.AccountID, emails)
			emailChannels = append(emailChannels, emails)
			// need to use tokens array here to ensure pointer isn't same memory address each time
			tokensInUse = append(tokensInUse, &tokens[index])
		}
	}

	fetchedEmails := []*database.Item{}
	badTokens := []*database.ExternalAPIToken{}
	for index, emailChannel := range emailChannels {
		emailResult := <-emailChannel
		if emailResult.Error != nil {
			if emailResult.IsBadToken {
				badTokens = append(badTokens, tokensInUse[index])
			}
			continue
		}
		fetchedEmails = append(fetchedEmails, emailResult.Emails...)
	}

	for index := range fetchedEmails {
		fetchedEmails[index].TaskBase.Body = "<base target=\"_blank\">" + fetchedEmails[index].TaskBase.Body
	}

	err = markReadMessagesInDB(api, db, currentEmails, &fetchedEmails)
	if err != nil {
		Handle500(c)
		return
	}

	orderedMessages, err := api.orderMessages(
		db,
		fetchedEmails,
		userID.(primitive.ObjectID),
	)
	if err != nil {
		Handle500(c)
		return
	}
	for _, token := range badTokens {
		// For now, marking as GT_TASK source to show visual distinction from emails
		taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(external.TASK_SOURCE_ID_GT_TASK)
		if err != nil {
			log.Printf("error loading task service: %v", err)
			Handle500(c)
			return
		}
		body := (`<!DOCTYPE html><html lang="en"><head></head><body>Please un-link and re-link your email account ` +
			`in the settings page to continue seeing messages from this account. If this is your primary account, ` +
			`you will need to visit the following link to reauthorize: ` +
			`<a href="%slogin/?force_prompt=true">Click here</a><br><br><i>Note: once we are verified by Google, this ` +
			`issue will happen less often!</i></body></html>`)
		body = fmt.Sprintf(body, config.GetConfigValue("SERVER_URL"))
		if err != nil {
			log.Printf("failed to convert plain text to HTML: %v", err)
			continue
		}
		orderedMessages = append([]*message{
			{
				ID:       primitive.NilObjectID,
				Title:    fmt.Sprintf("%s needs to be re-authorized!", token.AccountID),
				Deeplink: "",
				Body:     body,
				Sender:   "General Task",
				SentAt:   time.Now().Format(time.RFC3339),
				IsUnread: false,
				Source: messageSource{
					AccountId:     token.AccountID,
					Name:          taskSourceResult.Details.Name,
					Logo:          taskSourceResult.Details.Logo,
					IsCompletable: taskSourceResult.Details.IsCreatable,
					IsReplyable:   taskSourceResult.Details.IsReplyable,
				},
			},
		}, orderedMessages...)
	}
	c.JSON(200, orderedMessages)
}

func (api *API) orderMessages(
	db *mongo.Database,
	fetchedEmails []*database.Item,
	userID primitive.ObjectID,
) ([]*message, error) {
	orderingSetting, err := settings.GetUserSetting(db, userID, settings.SettingFieldEmailOrderingPreference)
	if err != nil {
		log.Printf("failed to fetch email ordering setting: %v", err)
		return []*message{}, err
	}
	newestEmailsFirst := *orderingSetting == settings.ChoiceKeyNewestFirst
	sort.SliceStable(fetchedEmails, func(i, j int) bool {
		a := fetchedEmails[i]
		b := fetchedEmails[j]
		if newestEmailsFirst {
			return a.TaskBase.CreatedAtExternal > b.TaskBase.CreatedAtExternal
		} else {
			return a.TaskBase.CreatedAtExternal < b.TaskBase.CreatedAtExternal
		}
	})

	var messages []*message
	for _, email := range fetchedEmails {
		messages = append(messages, api.emailToMessage(email))
	}
	return messages, nil
}

func markReadMessagesInDB(
	api *API,
	db *mongo.Database,
	currentEmails *[]database.Item,
	fetchedEmails *[]*database.Item,
) error {
	fetchedEmailTaskIDs := make(map[primitive.ObjectID]bool)
	for _, email := range *fetchedEmails {
		fetchedEmailTaskIDs[email.ID] = true
	}
	// There's a more efficient way to do this but this way is easy to understand
	for _, currentEmail := range *currentEmails {
		if !fetchedEmailTaskIDs[currentEmail.ID] {
			f := false
			messageChangeable := database.MessageChangeable{
				EmailChangeable: database.EmailChangeable{
					IsUnread: &f,
				},
			}
			err := updateMessageInDB(api, nil, currentEmail.ID, currentEmail.UserID, &messageChangeable)
			if err != nil {
				log.Printf("failed to mark message read: (ID=%v) with error: %v", currentEmail.ID, err)
				return err
			}
		}
	}
	return nil
}

func (api *API) emailToMessage(e *database.Item) *message {
	messageSourceResult, _ := api.ExternalConfig.GetTaskSourceResult(e.SourceID)

	recipients := Recipients{
		To:  getRecipients(e.Recipients.To),
		Cc:  getRecipients(e.Recipients.Cc),
		Bcc: getRecipients(e.Recipients.Bcc),
	}

	return &message{
		ID:         e.ID,
		Title:      e.Title,
		Deeplink:   e.Deeplink,
		Body:       e.Body,
		Sender:     e.Sender,
		Recipients: recipients,
		SentAt:     e.CreatedAtExternal.Time().Format(time.RFC3339),
		IsUnread:   e.Email.IsUnread,
		Source: messageSource{
			AccountId:     e.SourceAccountID,
			Name:          messageSourceResult.Details.Name,
			Logo:          messageSourceResult.Details.Logo,
			IsCompletable: messageSourceResult.Details.IsCreatable,
			IsReplyable:   messageSourceResult.Details.IsReplyable,
		},
	}
}

func getRecipients(dbRecipient []database.Recipient) []Recipient {
	if len(dbRecipient) == 0 {
		return make([]Recipient, 0)
	}
	recipients := make([]Recipient, len(dbRecipient))
	for i, recipient := range dbRecipient {
		recipients[i] = Recipient{
			Name:  recipient.Name,
			Email: recipient.Email,
		}
	}
	return recipients
}
