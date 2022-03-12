package api

import (
	"log"
	"sort"
	"time"

	"github.com/GeneralTask/task-manager/backend/settings"

	"github.com/GeneralTask/task-manager/backend/database"
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

type senderV2 struct {
	Name  		string `bson:"name"`
	Email  		string `bson:"email"`
	ReplyTo     string `bson:"reply_to"`
}

type message struct {
	ID         primitive.ObjectID `json:"id"`
	Title      string             `json:"title"`
	Deeplink   string             `json:"deeplink"`
	Body       string             `json:"body"`
	Sender     string             `json:"sender"`
	SenderV2 senderV2      		  `json:"sender_v2"`
	Recipients Recipients         `json:"recipients"`
	SentAt     string             `json:"sent_at"`
	IsUnread   bool               `json:"is_unread"`
	Source     messageSource      `json:"source"`
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

	return &message{
		ID:       e.ID,
		Title:    e.Title,
		Deeplink: e.Deeplink,
		Body:     e.Body,
		Sender:   e.Sender,
		SenderV2: senderV2{
			Name: e.Sender,
			Email: e.Email.SenderEmail,
			ReplyTo: e.Email.ReplyTo,
		},
		Recipients: Recipients{
			To:  getRecipients(e.Recipients.To),
			Cc:  getRecipients(e.Recipients.Cc),
			Bcc: getRecipients(e.Recipients.Bcc),
		},
		SentAt:   e.CreatedAtExternal.Time().Format(time.RFC3339),
		IsUnread: e.Email.IsUnread,
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
		return []Recipient{}
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
