package api

import (
	"time"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type messageSource struct {
	AccountId   string `json:"account_id"`
	Name        string `json:"name"`
	Logo        string `json:"logo"`
	LogoV2      string `json:"logo_v2"`
	IsReplyable bool   `json:"is_replyable"`
}

type senderV2 struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	ReplyTo string `json:"reply_to"`
}

type message struct {
	ID         primitive.ObjectID `json:"id"`
	Title      string             `json:"title"`
	Deeplink   string             `json:"deeplink"`
	Body       string             `json:"body"`
	Sender     string             `json:"sender"`
	SenderV2   senderV2           `json:"sender_v2"`
	Recipients Recipients         `json:"recipients"`
	SentAt     string             `json:"sent_at"`
	IsUnread   bool               `json:"is_unread"`
	IsTask     bool               `json:"is_task"`
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
				log.Error().Err(err).Msgf("failed to mark message read: (ID=%v)", currentEmail.ID)
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
		Body:     e.TaskBase.Body,
		Sender:   e.Sender,
		SenderV2: senderV2{
			Name:    e.Sender,
			Email:   e.Email.SenderEmail,
			ReplyTo: e.Email.ReplyTo,
		},
		Recipients: Recipients{
			To:  getRecipients(e.Recipients.To),
			Cc:  getRecipients(e.Recipients.Cc),
			Bcc: getRecipients(e.Recipients.Bcc),
		},
		SentAt:   e.CreatedAtExternal.Time().Format(time.RFC3339),
		IsUnread: e.Email.IsUnread,
		IsTask:   e.TaskType.IsTask,
		Source: messageSource{
			AccountId:   e.SourceAccountID,
			Name:        messageSourceResult.Details.Name,
			Logo:        messageSourceResult.Details.Logo,
			LogoV2:      messageSourceResult.Details.LogoV2,
			IsReplyable: messageSourceResult.Details.IsReplyable,
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
