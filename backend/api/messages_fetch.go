package api

import (
	"context"
	"fmt"
	"github.com/rs/zerolog/log"
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
		log.Error().Msgf("failed to find user: %v", err)
		Handle500(c)
		return
	}

	currentEmails, err := database.GetEmails(db, userID.(primitive.ObjectID), true, database.Pagination{})
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
		log.Error().Msgf("failed to fetch api tokens: %v", err)
		Handle500(c)
		return
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tokens)
	if err != nil {
		log.Error().Msgf("failed to iterate through api tokens: %v", err)
		Handle500(c)
		return
	}

	_, fullRefresh := c.GetQuery("fullRefresh")
	emailChannels := []chan external.EmailResult{}
	emailChannelToToken := make(map[chan external.EmailResult]database.ExternalAPIToken)
	// Loop through linked accounts and fetch relevant items
	for _, token := range tokens {
		taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(token.ServiceID)
		log.Debug().Msgf("Processing task service %+v for account %s", taskServiceResult.Details.Name, token.AccountID)
		if err != nil {
			log.Error().Err(err).Msg("error loading task service")
			Handle500(c)
			return
		}
		for _, taskSourceResult := range taskServiceResult.Sources {
			log.Debug().Str("taskServiceID", taskServiceResult.Details.ID).Str("taskSourceID", taskSourceResult.Details.ID).
				Str("tokenAccountID", token.AccountID).Send()
			var emails = make(chan external.EmailResult)
			go taskSourceResult.Source.GetEmails(userID.(primitive.ObjectID), token.AccountID, emails, fullRefresh)
			emailChannels = append(emailChannels, emails)
			emailChannelToToken[emails] = token
		}
	}

	fetchedEmails := []*database.Item{}
	badTokens := []database.ExternalAPIToken{}
	failedFetchSources := make(map[string]bool)
	for _, emailChannel := range emailChannels {
		emailResult := <-emailChannel
		if emailResult.Error != nil {
			if emailResult.IsBadToken {
				badTokens = append(badTokens, emailChannelToToken[emailChannel])
			}
			failedFetchSources[emailResult.SourceID] = true
			continue
		}
		fetchedEmails = append(fetchedEmails, emailResult.Emails...)
	}

	for index := range fetchedEmails {
		fetchedEmails[index].TaskBase.Body = "<base target=\"_blank\">" + fetchedEmails[index].TaskBase.Body
	}

	err = markReadMessagesInDB(api, db, currentEmails, &fetchedEmails, failedFetchSources)
	if err != nil {
		Handle500(c)
		return
	}

	var badTokenMessages []*message
	for _, token := range badTokens {
		// For now, marking as GT_TASK source to show visual distinction from emails
		taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(external.TASK_SOURCE_ID_GT_TASK)
		if err != nil {
			log.Error().Msgf("error loading task service: %v", err)
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
			log.Error().Msgf("failed to convert plain text to HTML: %v", err)
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
					AccountId:   token.AccountID,
					Name:        taskSourceResult.Details.Name,
					Logo:        taskSourceResult.Details.Logo,
					LogoV2:      taskSourceResult.Details.LogoV2,
					IsReplyable: taskSourceResult.Details.IsReplyable,
				},
			},
		}, badTokenMessages...)
	}
	c.JSON(200, badTokenMessages)
}
