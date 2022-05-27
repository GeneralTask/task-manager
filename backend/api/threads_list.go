package api

import (
	"context"
	"sort"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/constants"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const DEFAULT_THREAD_LIMIT int = 100

type email struct {
	MessageID  primitive.ObjectID `json:"message_id"`
	Subject    string             `json:"subject"`
	Body       string             `json:"body"`
	SentAt     string             `json:"sent_at"`
	IsUnread   bool               `json:"is_unread"`
	Sender     senderV2           `json:"sender"`
	Recipients Recipients         `json:"recipients"`
}

type ThreadDetailsResponse struct {
	ID         primitive.ObjectID `json:"id"`
	Deeplink   string             `json:"deeplink"`
	IsTask     bool               `json:"is_task"`
	IsArchived bool               `json:"is_archived"`
	Source     messageSource      `json:"source"`
	Emails     *[]email           `json:"emails"`
}

type accountParams struct {
	SourceID        *string `form:"source_id"`
	SourceAccountID *string `form:"source_account_id"`
}

type threadsListParams struct {
	database.Pagination `form:",inline"`
	OnlyUnread          *bool `form:"only_unread"`
	IsArchived        *bool `form:"is_archived"`
	accountParams       `form:",inline"`
}

func (api *API) ThreadsList(c *gin.Context) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	userID, _ := c.Get("user")
	var userObject database.User
	userCollection := database.GetUserCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = userCollection.FindOne(dbCtx, bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		log.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	var params threadsListParams
	err = c.Bind(&params)
	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	onlyUnread := false
	if params.OnlyUnread != nil && *params.OnlyUnread {
		onlyUnread = true
	}
	isArchived := false
	if params.IsArchived != nil && *params.IsArchived {
		isArchived = true
	}
	if !database.IsValidPagination(params.Pagination) {
		limit := DEFAULT_THREAD_LIMIT
		page := 1
		params.Pagination = database.Pagination{Limit: &limit, Page: &page}
	}

	var accountFilter *[]bson.M
	if params.SourceID != nil && params.SourceAccountID != nil {
		accountFilter = &[]bson.M{{"source_id": params.SourceID}, {"source_account_id": params.SourceAccountID}}
	}
	threads, err := database.GetEmailThreads(db, userID.(primitive.ObjectID), onlyUnread, isArchived, params.Pagination, accountFilter)
	if err != nil {
		Handle500(c)
		return
	}

	orderedMessages := api.orderThreads(threads)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, orderedMessages)
}

func (api *API) orderThreads(threadItems *[]database.Item) []*ThreadDetailsResponse {
	sort.SliceStable(*threadItems, func(i, j int) bool {
		a := (*threadItems)[i]
		b := (*threadItems)[j]
		return formatDateTime(a.EmailThread.LastUpdatedAt) > formatDateTime(b.EmailThread.LastUpdatedAt)
	})

	var responseThreads []*ThreadDetailsResponse
	for _, threadItem := range *threadItems {
		responseThreads = append(responseThreads, api.createThreadResponse(&threadItem))
	}
	return responseThreads
}

func (api *API) createThreadResponse(t *database.Item) *ThreadDetailsResponse {
	threadSourceResult, _ := api.ExternalConfig.GetTaskSourceResult(t.SourceID)
	return &ThreadDetailsResponse{
		ID:         t.ID,
		IsTask:     t.IsTask,
		IsArchived: t.IsArchived,
		Source: messageSource{
			AccountId:   t.SourceAccountID,
			Name:        threadSourceResult.Details.Name,
			Logo:        threadSourceResult.Details.Logo,
			LogoV2:      threadSourceResult.Details.LogoV2,
			IsReplyable: threadSourceResult.Details.IsReplyable,
		},
		Emails: createThreadEmailsResponse(&t.Emails),
	}
}

func createThreadEmailsResponse(dbEmails *[]database.Email) *[]email {
	var emails []email
	for _, e := range *dbEmails {
		formattedEmail := email{
			MessageID: e.MessageID,
			Subject:   e.Subject,
			Body:      e.Body,
			SentAt:    formatDateTime(e.SentAt).Time().UTC().Format(time.RFC3339),
			IsUnread:  e.IsUnread,
			Sender: senderV2{
				Name:    e.SenderName,
				Email:   e.SenderEmail,
				ReplyTo: e.ReplyTo,
			},
			Recipients: Recipients{
				To:  getRecipients(e.Recipients.To),
				Cc:  getRecipients(e.Recipients.Cc),
				Bcc: getRecipients(e.Recipients.Bcc),
			},
		}
		emails = append(emails, formattedEmail)
	}
	return &emails
}

// formatDateTime corrects the DateTime object if it was constructed with milliseconds - https://stackoverflow.com/questions/23929145/how-to-test-if-a-given-time-stamp-is-in-seconds-or-milliseconds
// This is a hack in order to correct previously malformed DateTimes computed using milliseconds
func formatDateTime(dt primitive.DateTime) primitive.DateTime {
	unixTS := dt.Time().Unix()
	if unixTS > 99999999999 {
		unixTS = unixTS / 1000
	}
	return primitive.NewDateTimeFromTime(time.Unix(unixTS, 0))
}
