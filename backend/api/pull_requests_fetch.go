package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) PullRequestsFetch(c *gin.Context) {
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
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	var tokens []database.ExternalAPIToken
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := externalAPITokenCollection.Find(
		dbCtx,
		bson.M{"user_id": userID},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch api tokens")
		Handle500(c)
		return
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tokens)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to iterate through api tokens")
		Handle500(c)
		return
	}

	pullRequestChannels := []chan external.PullRequestResult{}
	// Loop through linked accounts and fetch relevant items
	for _, token := range tokens {
		taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(token.ServiceID)
		if err != nil {
			api.Logger.Error().Err(err).Msg("error loading task service")
			Handle500(c)
			return
		}
		for _, taskSourceResult := range taskServiceResult.Sources {
			var pullRequests = make(chan external.PullRequestResult)
			go taskSourceResult.Source.GetPullRequests(userID.(primitive.ObjectID), token.AccountID, pullRequests)
			pullRequestChannels = append(pullRequestChannels, pullRequests)
		}
	}

	for _, pullRequestChannel := range pullRequestChannels {
		pullRequestResult := <-pullRequestChannel
		if pullRequestResult.Error != nil {
			api.Logger.Error().Err(pullRequestResult.Error).Msg("failed to load PR source")
			continue
		}
	}
	c.JSON(200, gin.H{})
}
