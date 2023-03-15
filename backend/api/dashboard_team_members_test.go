package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

type DashboardTeamMemberCreateResponse struct {
	TeamMemberID string `json:"team_member_id"`
}

func TestDashboardTeamMemberCreate(t *testing.T) {
	authToken := login("test_dashboard_team_members_create@generaltask.com", "")
	UnauthorizedTest(t, "GET", "/dashboard/data/", nil)
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, api.DB, authToken)
	t.Run("NoBusinessAccess", func(t *testing.T) {
		ServeRequest(t, authToken, "POST", "/dashboard/team_members/", nil, http.StatusForbidden, api)
	})
	_, err := database.GetUserCollection(api.DB).UpdateOne(context.Background(), bson.M{"_id": userID}, bson.M{"$set": bson.M{"business_mode_enabled": true}})
	assert.NoError(t, err)
	t.Run("MissingName", func(t *testing.T) {
		bodyParams, err := json.Marshal(DashboardTeamMemberCreateParams{
			Email: "scott@gt.com",
		})
		assert.NoError(t, err)

		ServeRequest(t, authToken, "POST", "/dashboard/team_members/", bytes.NewBuffer(bodyParams), http.StatusBadRequest, api)
	})
	t.Run("MissingEmail", func(t *testing.T) {
		bodyParams, err := json.Marshal(DashboardTeamMemberCreateParams{
			Name:     "scott",
			GithubID: "scottmai",
		})
		assert.NoError(t, err)

		ServeRequest(t, authToken, "POST", "/dashboard/team_members/", bytes.NewBuffer(bodyParams), http.StatusBadRequest, api)
	})
	t.Run("SuccessNoGithubID", func(t *testing.T) {
		dashboardTeam, err := database.GetOrCreateDashboardTeam(api.DB, userID)
		assert.NoError(t, err)

		bodyParams, err := json.Marshal(DashboardTeamMemberCreateParams{
			Name:  "scott",
			Email: "scott@gt.com",
		})
		assert.NoError(t, err)

		response := ServeRequest(t, authToken, "POST", "/dashboard/team_members/", bytes.NewBuffer(bodyParams), http.StatusCreated, api)
		var result DashboardTeamMemberCreateResponse
		err = json.Unmarshal(response, &result)

		assert.NoError(t, err)

		teamMembers, err := database.GetDashboardTeamMembers(api.DB, dashboardTeam.ID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*teamMembers))
		teamMember := (*teamMembers)[0]
		assertDashboardTeamMembersAreEqual(t, database.DashboardTeamMember{
			ID:     teamMember.ID,
			TeamID: dashboardTeam.ID,
			Name:   "scott",
			Email:  "scott@gt.com",
		}, teamMember)
	})
	t.Run("SuccessAllFields", func(t *testing.T) {
		dashboardTeam, err := database.GetOrCreateDashboardTeam(api.DB, userID)
		assert.NoError(t, err)

		bodyParams, err := json.Marshal(DashboardTeamMemberCreateParams{
			Name:     "scott",
			Email:    "scott@gt.com",
			GithubID: "scottmai",
		})
		assert.NoError(t, err)

		response := ServeRequest(t, authToken, "POST", "/dashboard/team_members/", bytes.NewBuffer(bodyParams), http.StatusCreated, api)
		var result DashboardTeamMemberCreateResponse
		err = json.Unmarshal(response, &result)

		assert.NoError(t, err)

		teamMembers, err := database.GetDashboardTeamMembers(api.DB, dashboardTeam.ID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*teamMembers))
		teamMember := (*teamMembers)[0]
		assertDashboardTeamMembersAreEqual(t, database.DashboardTeamMember{
			ID:       teamMember.ID,
			TeamID:   dashboardTeam.ID,
			Name:     "scott",
			Email:    "scott@gt.com",
			GithubID: "scottmai",
		}, teamMember)
	})
}

func assertDashboardTeamMembersAreEqual(t *testing.T, expected, actual database.DashboardTeamMember) {
	assert.Equal(t, expected.ID, actual.ID)
	assert.Equal(t, expected.TeamID, actual.TeamID)
	assert.Equal(t, expected.Name, actual.Name)
	assert.Equal(t, expected.Email, actual.Email)
	assert.Equal(t, expected.GithubID, actual.GithubID)
}
