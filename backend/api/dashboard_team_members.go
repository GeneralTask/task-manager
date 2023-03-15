package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DashboardTeamMemberCreateParams struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	GithubID string `json:"github_id"`
}

func (api *API) DashboardTeamMemberCreate(c *gin.Context) {
	var teamMemberCreateParams DashboardTeamMemberCreateParams
	err := c.BindJSON(&teamMemberCreateParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}

	userID := getUserIDFromContext(c)
	dashboardTeam, err := database.GetOrCreateDashboardTeam(api.DB, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to get dashboard team")
		c.JSON(500, gin.H{"detail": "failed to get dashboard team"})
		return
	}
	if err != nil || dashboardTeam == nil {
		Handle500(c)
		return
	}

	teamMemberCollection := database.GetDashboardTeamMemberCollection(api.DB)
	insertResult, err := teamMemberCollection.InsertOne(context.Background(), database.DashboardTeamMember{
		TeamID:   dashboardTeam.ID,
		Name:     teamMemberCreateParams.Name,
		Email:    teamMemberCreateParams.Email,
		GithubID: teamMemberCreateParams.GithubID,
	})

	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to create team member")
		c.JSON(503, gin.H{"detail": "failed to create team member"})
		return
	}

	c.JSON(201, gin.H{"team_member_id": insertResult.InsertedID.(primitive.ObjectID)})

}
