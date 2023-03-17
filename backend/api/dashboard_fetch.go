package api

import (
	"fmt"

	"github.com/GeneralTask/task-manager/backend/jobs"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func (api *API) DashboardFetch(c *gin.Context) {
	userID := getUserIDFromContext(c)
	tokens, err := api.getExternalTokens(userID)
	if err != nil {
		Handle500(c)
		return
	}

	_, _, err = api.fetchPRs(userID, tokens)
	if err != nil {
		Handle500(c)
		return
	}
	cutoff := jobs.GetPullRequestCutoffTime(api.GetCurrentTime(), jobs.DEFAULT_LOOKBACK_DAYS)
	fmt.Println("CUTOFF:", cutoff)
	// run github data fetch for user
	// run updateGithubIndustryData but with specific team / team members
	c.JSON(200, bson.M{})
}
