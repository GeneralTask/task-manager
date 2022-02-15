package api

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) MessagesFetch(c *gin.Context) {
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

	currentEmails, err := database.GetActiveEmails(db, userID.(primitive.ObjectID))
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
	// Loop through linked accounts and fetch relevant items
	for _, token := range tokens {
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
		}
	}

	fetchedEmails := []*database.Item{}
	badTokens := []*database.ExternalAPIToken{}
	for index, emailChannel := range emailChannels {
		emailResult := <-emailChannel
		if emailResult.Error != nil {
			if emailResult.IsBadToken {
				badTokens = append(badTokens, &tokens[index])
			}
			continue
		}
		fetchedEmails = append(fetchedEmails, emailResult.Emails...)
	}

	for index := range fetchedEmails {
		fetchedEmails[index].TaskBase.Body = "<base target=\"_blank\">" + fetchedEmails[index].TaskBase.Body
	}

	err = markCompletedMessages(db, currentEmails, &fetchedEmails)
	if err != nil {
		Handle500(c)
		return
	}

	var badTokenMessages []*message
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
		badTokenMessages = append([]*message{
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
		}, badTokenMessages...)
	}
	c.JSON(200, badTokenMessages)
}
