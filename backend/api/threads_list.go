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
	SMTPID     string             `json:"smtp_id"`
	Title      string             `json:"title"`
	Body       string             `json:"body"`
	SentAt     string             `json:"sent_at"`
	IsUnread   bool               `json:"is_unread"`
	Sender     senderV2           `json:"sender"`
	Recipients Recipients         `json:"recipients"`
}

type Thread struct {
	ID       primitive.ObjectID `json:"id"`
	Deeplink string             `json:"deeplink"`
	IsTask   bool               `json:"is_task"`
	Source   messageSource      `json:"source"`
	Emails   *[]email           `json:"emails"`
}

type threadsListParams struct {
	database.Pagination `form:",inline" json:",inline"`
	OnlyUnread          *bool `form:"only_unread" json:"only_unread"`
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
	err = c.Bind(&params)
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

	threads, err := database.GetEmailThreads(db, userID.(primitive.ObjectID), onlyUnread, params.Pagination)
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

func (api *API) createThreadResponse(t *database.Item) *Thread {
	messageSourceResult, _ := api.ExternalConfig.GetTaskSourceResult(t.SourceID)
	return &Thread{
		ID:     t.ID,
		IsTask: t.IsTask,
		Source: messageSource{
			AccountId:     t.SourceAccountID,
			Name:          messageSourceResult.Details.Name,
			Logo:          messageSourceResult.Details.Logo,
			LogoV2:        messageSourceResult.Details.LogoV2,
			IsCompletable: messageSourceResult.Details.IsCreatable,
			IsReplyable:   messageSourceResult.Details.IsReplyable,
		},
		Emails: api.createThreadEmailsResponse(&t.Emails),
	}
}

func (api *API) createThreadEmailsResponse(dbEmails *[]database.Email) *[]email {
	var emails []email
	for _, e := range *dbEmails {
		formattedEmail := email{
			SMTPID: e.SMTPID,
			Title:    e.Subject,
			Body:     e.Body,
			SentAt:   e.SentAt.Time().Format(time.RFC3339),
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
