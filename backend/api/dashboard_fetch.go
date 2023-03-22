package api

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/jobs"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func (api *API) DashboardFetch(c *gin.Context) {
	userID := getUserIDFromContext(c)
	tokens, err := database.GetAllExternalTokens(api.DB, userID)
	if err != nil {
		Handle500(c)
		return
	}

	_, _, err = api.fetchPRs(userID, tokens)
	if err != nil {
		Handle500(c)
		return
	}
	err = jobs.UpdateGithubTeamData(userID, api.GetCurrentTime(), jobs.DEFAULT_LOOKBACK_DAYS)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, bson.M{})
}
