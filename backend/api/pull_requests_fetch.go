package api

import (
	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) PullRequestsFetch(c *gin.Context) {
	userID := getUserIDFromContext(c)
	tokens, err := database.GetAllExternalTokens(api.DB, userID)
	if err != nil {
		Handle500(c)
		return
	}

	currentPRs, err := database.GetActivePRs(api.DB, userID)
	if err != nil {
		Handle500(c)
		return
	}

	fetchedPRs, failedFetchSources, err := api.fetchPRs(userID, tokens)
	if err != nil {
		Handle500(c)
		return
	}

	err = api.adjustForCompletedPullRequests(api.DB, currentPRs, &fetchedPRs, failedFetchSources)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to adjust for completed tasks")
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{})
}

func (api *API) fetchPRs(userID interface{}, tokens []database.ExternalAPIToken) ([]*database.PullRequest, map[string]bool, error) {
	pullRequestChannels := []chan external.PullRequestResult{}
	// Loop through linked accounts and fetch relevant items
	for _, token := range tokens {
		taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(token.ServiceID)
		if err != nil {
			api.Logger.Error().Err(err).Msg("error loading task service")
			return nil, map[string]bool{}, err
		}
		for _, taskSourceResult := range taskServiceResult.Sources {
			var pullRequests = make(chan external.PullRequestResult)
			go taskSourceResult.Source.GetPullRequests(api.DB, userID.(primitive.ObjectID), token.AccountID, pullRequests)
			pullRequestChannels = append(pullRequestChannels, pullRequests)
		}
	}

	pullRequests := []*database.PullRequest{}
	failedFetchSources := make(map[string]bool)
	for _, pullRequestChannel := range pullRequestChannels {
		pullRequestResult := <-pullRequestChannel
		if pullRequestResult.Error != nil {
			if !pullRequestResult.SuppressSentry {
				api.Logger.Error().Err(pullRequestResult.Error).Msg("failed to load PR source")
			}
			failedFetchSources[pullRequestResult.SourceID] = true
			continue
		}
		pullRequests = append(pullRequests, pullRequestResult.PullRequests...)
	}
	return pullRequests, failedFetchSources, nil
}
