package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DashboardTeamMemberCreateParams struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email"`
	GithubID string `json:"github_id"`
}
type DashboardTeamMemberResult struct {
	ID                          string `json:"id,omitempty"`
	Name                        string `json:"name,omitempty"`
	Email                       string `json:"email,omitempty"`
	GithubID                    string `json:"github_id,omitempty"`
	HasBeenInvitedToLeaderboard bool   `json:"has_been_invited_to_leaderboard,omitempty"`
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
	if err != nil || dashboardTeam == nil {
		api.Logger.Error().Err(err).Msg("failed to get dashboard team")
		c.JSON(500, gin.H{"detail": "failed to get dashboard team"})
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

func (api *API) DashboardTeamMemberDelete(c *gin.Context) {
	teamMemberIDHex := c.Param("team_member_id")
	teamMemberID, err := primitive.ObjectIDFromHex(teamMemberIDHex)
	if err != nil {
		Handle404(c)
		return
	}
	userID := getUserIDFromContext(c)
	dashboardTeam, err := database.GetOrCreateDashboardTeam(api.DB, userID)
	if err != nil || dashboardTeam == nil {
		api.Logger.Error().Err(err).Msg("failed to get dashboard team")
		c.JSON(500, gin.H{"detail": "failed to get dashboard team"})
		return
	}
	teamMemberCollection := database.GetDashboardTeamMemberCollection(api.DB)
	deletedResult, err := teamMemberCollection.DeleteOne(context.Background(), database.DashboardTeamMember{
		ID:     teamMemberID,
		TeamID: dashboardTeam.ID,
	})
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to delete team member")
		c.JSON(500, gin.H{"detail": "failed to delete team member"})
		return
	}
	if deletedResult.DeletedCount == 0 {
		Handle404(c)
		return
	}
	c.JSON(204, gin.H{})
}

func (api *API) DashboardTeamMembersList(c *gin.Context) {
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

	dashboardTeamMembers, err := database.GetDashboardTeamMembers(api.DB, dashboardTeam.ID)
	if err != nil || dashboardTeamMembers == nil {
		Handle500(c)
		return
	}
	var teamMemberResults []DashboardTeamMemberResult
	for _, dashboardTeamMember := range *dashboardTeamMembers {
		teamMemberResults = append(teamMemberResults, DashboardTeamMemberResult{
			ID:                          dashboardTeamMember.ID.Hex(),
			Name:                        dashboardTeamMember.Name,
			Email:                       dashboardTeamMember.Email,
			GithubID:                    dashboardTeamMember.GithubID,
			HasBeenInvitedToLeaderboard: dashboardTeamMember.HasBeenInvitedToLeaderboard,
		})
	}
	c.JSON(200, teamMemberResults)
}
