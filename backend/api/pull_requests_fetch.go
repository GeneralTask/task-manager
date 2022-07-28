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

	var tokens []database.ExternalAPIToken
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
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

	activePRs, err := database.GetActivePRs(db, userID.(primitive.ObjectID))
	if err != nil {
		Handle500(c)
		return
	}

	currentPRs, err := api.fetchPRs(userID, tokens)
	if err != nil {
		Handle500(c)
		return
	}

	err = api.adjustForCompletedTasks(db, currentPRs, activePRs, map[string]bool{})
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to adjust for completed tasks")
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{})
}

func (api *API) fetchPRs(userID interface{}, tokens []database.ExternalAPIToken) ([]external.PullRequestResult, error) {
	pullRequestChannels := []chan external.PullRequestResult{}
	// Loop through linked accounts and fetch relevant items
	for _, token := range tokens {
		taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(token.ServiceID)
		if err != nil {
			api.Logger.Error().Err(err).Msg("error loading task service")
			return nil, err
		}
		for _, taskSourceResult := range taskServiceResult.Sources {
			var pullRequests = make(chan external.PullRequestResult)
			go taskSourceResult.Source.GetPullRequests(userID.(primitive.ObjectID), token.AccountID, pullRequests)
			pullRequestChannels = append(pullRequestChannels, pullRequests)
		}
	}

	var pullResults []external.PullRequestResult
	for _, pullRequestChannel := range pullRequestChannels {
		pullRequestResult := <-pullRequestChannel
		if pullRequestResult.Error != nil {
			api.Logger.Error().Err(pullRequestResult.Error).Msg("failed to load PR source")
			continue
		}
		pullResults = append(pullResults, pullRequestResult)
	}
	return pullResults, nil
}
