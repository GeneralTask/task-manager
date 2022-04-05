package api

import (
	"context"
	"log"
	"sort"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const DEFAULT_THREAD_LIMIT int = 100

type email struct {
	SMTPID     string     `json:"smtp_id"`
	Subject    string     `json:"subject"`
	Body       string     `json:"body"`
	SentAt     string     `json:"sent_at"`
	IsUnread   bool       `json:"is_unread"`
	Sender     senderV2   `json:"sender"`
	Recipients Recipients `json:"recipients"`
}

type Thread struct {
	ID       primitive.ObjectID `json:"id"`
	Deeplink string             `json:"deeplink"`
	IsTask   bool               `json:"is_task"`
	Source   messageSource      `json:"source"`
	Emails   *[]email           `json:"emails"`
}

type accountParams struct {
	SourceID        string `json:"source_id"`
	SourceAccountID string `json:"source_account_id"`
}

type threadsListParams struct {
	database.Pagination `form:",inline" json:",inline"`
	OnlyUnread          *bool          `form:"only_unread" json:"only_unread"`
	Account             *accountParams `json:"account"`
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
		log.Printf("failed to find user: %v", err)
		Handle500(c)
		return
	}

	var params threadsListParams
	err = c.BindJSON(&params)
	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}
	onlyUnread := false
	if params.OnlyUnread != nil && *params.OnlyUnread {
		onlyUnread = true
	}
	if !database.IsValidPagination(params.Pagination) {
		limit := DEFAULT_THREAD_LIMIT
		page := 1
		params.Pagination = database.Pagination{Limit: &limit, Page: &page}
	}

	var accountFilter *[]bson.M
	if params.Account != nil {
		accountFilter = &[]bson.M{{"source_id": params.Account.SourceID}, {"source_account_id": params.Account.SourceAccountID}}
	}
	threads, err := database.GetEmailThreads(db, userID.(primitive.ObjectID), onlyUnread, params.Pagination, accountFilter)
	if err != nil {
		Handle500(c)
		return
	}

	orderedMessages := api.orderThreads(
		db,
		threads,
		userID.(primitive.ObjectID),
	)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, orderedMessages)
}

func (api *API) orderThreads(
	db *mongo.Database,
	threadItems *[]database.Item,
	userID primitive.ObjectID,
) []*Thread {
	sort.SliceStable(*threadItems, func(i, j int) bool {
		a := (*threadItems)[i]
		b := (*threadItems)[j]
		return a.EmailThread.LastUpdatedAt > b.EmailThread.LastUpdatedAt
	})

	var responseThreads []*Thread
	for _, threadItem := range *threadItems {
		responseThreads = append(responseThreads, api.createThreadResponse(&threadItem))
	}
	return responseThreads
}

func (api *API) createThreadResponse(t *database.Item) *Thread {
	threadSourceResult, _ := api.ExternalConfig.GetTaskSourceResult(t.SourceID)
	return &Thread{
		ID:     t.ID,
		IsTask: t.IsTask,
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
			SMTPID:   e.SMTPID,
			Subject:  e.Subject,
			Body:     e.Body,
			SentAt:   e.SentAt.Time().UTC().Format(time.RFC3339),
			IsUnread: e.IsUnread,
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
