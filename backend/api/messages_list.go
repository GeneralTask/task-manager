package api

import (
	"log"
	"time"

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

func markReadMessagesInDB(
	api *API,
	db *mongo.Database,
	currentEmails *[]database.Item,
	fetchedEmails *[]*database.Item,
	failedFetchSources map[string]bool,
) error {
	fetchedEmailTaskIDs := make(map[primitive.ObjectID]bool)
	for _, email := range *fetchedEmails {
		fetchedEmailTaskIDs[email.ID] = true
	}
	// There's a more efficient way to do this but this way is easy to understand
	for _, currentEmail := range *currentEmails {
		if !fetchedEmailTaskIDs[currentEmail.ID] && !failedFetchSources[currentEmail.SourceID] {
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
