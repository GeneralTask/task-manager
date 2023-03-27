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
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DashboardTeamMemberCreateResponse struct {
	TeamMemberID string `json:"team_member_id"`
}

func TestDashboardTeamMemberCreate(t *testing.T) {
	authToken := login("test_dashboard_team_members_create@generaltask.com", "")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, api.DB, authToken)

	UnauthorizedTest(t, "POST", "/dashboard/team_members/", nil)
	NoBusinessAccessTest(t, "POST", "/dashboard/team_members/", api, authToken)
	EnableBusinessAccess(t, api, userID)
	t.Run("MissingName", func(t *testing.T) {
		database.GetDashboardTeamMemberCollection(api.DB).DeleteMany(context.Background(), bson.M{})
		bodyParams, err := json.Marshal(DashboardTeamMemberCreateParams{
			Email: "scott@gt.com",
		})
		assert.NoError(t, err)

		ServeRequest(t, authToken, "POST", "/dashboard/team_members/", bytes.NewBuffer(bodyParams), http.StatusBadRequest, api)
	})
	t.Run("SuccessNameOnly", func(t *testing.T) {
		database.GetDashboardTeamMemberCollection(api.DB).DeleteMany(context.Background(), bson.M{})
		dashboardTeam, err := database.GetOrCreateDashboardTeam(api.DB, userID)
		assert.NoError(t, err)

		bodyParams, err := json.Marshal(DashboardTeamMemberCreateParams{
			Name: "scott",
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
		}, teamMember)
	})
	t.Run("SuccessNameAndEmail", func(t *testing.T) {
		database.GetDashboardTeamMemberCollection(api.DB).DeleteMany(context.Background(), bson.M{})
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
		database.GetDashboardTeamMemberCollection(api.DB).DeleteMany(context.Background(), bson.M{})
		dashboardTeam, err := database.GetOrCreateDashboardTeam(api.DB, userID)
		assert.NoError(t, err)

		bodyParams, err := json.Marshal(DashboardTeamMemberCreateParams{
			Name:     "john",
			Email:    "john@gt.com",
			GithubID: "jreinstra",
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
			Name:     "john",
			Email:    "john@gt.com",
			GithubID: "jreinstra",
		}, teamMember)
	})
}

func TestDashboardTeamMemberDelete(t *testing.T) {
	authToken := login("test_dashboard_team_members_delete@generaltask.com", "")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, api.DB, authToken)

	teamMemberCollection := database.GetDashboardTeamMemberCollection(api.DB)

	UnauthorizedTest(t, "DELETE", "/dashboard/team_members/id/", nil)
	NoBusinessAccessTest(t, "DELETE", "/dashboard/team_members/id/", api, authToken)
	EnableBusinessAccess(t, api, userID)
	t.Run("InvalidID", func(t *testing.T) {
		ServeRequest(t, authToken, "DELETE", "/dashboard/team_members/123/", nil, http.StatusNotFound, api)
	})
	t.Run("WrongCompany", func(t *testing.T) {
		newTeamID := primitive.NewObjectID()
		_, err := teamMemberCollection.InsertOne(context.Background(), database.DashboardTeamMember{
			TeamID: newTeamID,
		})
		assert.NoError(t, err)
		ServeRequest(t, authToken, "DELETE", "/dashboard/team_members/"+newTeamID.Hex()+"/", nil, http.StatusNotFound, api)
	})
	t.Run("Success", func(t *testing.T) {
		dashboardTeam, err := database.GetOrCreateDashboardTeam(api.DB, userID)
		insertedResult, err := teamMemberCollection.InsertOne(context.Background(), database.DashboardTeamMember{
			TeamID:   dashboardTeam.ID,
			Name:     "Scott",
			Email:    "scott@gt.com",
			GithubID: "scottmai",
		})
		assert.NoError(t, err)
		teamMemberID := insertedResult.InsertedID.(primitive.ObjectID)
		ServeRequest(t, authToken, "DELETE", "/dashboard/team_members/"+teamMemberID.Hex()+"/", nil, http.StatusNoContent, api)
	})
}

func TestDashboardTeamMemberList(t *testing.T) {
	authToken := login("test_dashboard_team_members_list@generaltask.com", "")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, api.DB, authToken)
	teamMemberCollection := database.GetDashboardTeamMemberCollection(api.DB)

	UnauthorizedTest(t, "GET", "/dashboard/team_members/", nil)
	NoBusinessAccessTest(t, "GET", "/dashboard/team_members/", api, authToken)
	EnableBusinessAccess(t, api, userID)
	t.Run("SuccessNoResults", func(t *testing.T) {
		teamMemberCollection.DeleteMany(context.Background(), bson.M{})
		response := ServeRequest(t, authToken, "GET", "/dashboard/team_members/", nil, http.StatusOK, api)
		var result []DashboardTeamMemberResult
		err := json.Unmarshal(response, &result)
		assert.NoError(t, err)
		assert.Equal(t, 0, len(result))
	})
	t.Run("Success", func(t *testing.T) {
		dashboardTeam, err := database.GetOrCreateDashboardTeam(api.DB, userID)
		assert.NoError(t, err)

		teamMember1 := database.DashboardTeamMember{
			TeamID:                      dashboardTeam.ID,
			Name:                        "scott",
			Email:                       "scott@gt.com",
			GithubID:                    "scottmai",
			HasBeenInvitedToLeaderboard: true,
		}
		teamMember2 := database.DashboardTeamMember{
			TeamID: dashboardTeam.ID,
			Name:   "john",
			Email:  "john@gt.com",
		}
		teamMember3 := database.DashboardTeamMember{
			TeamID:   dashboardTeam.ID,
			Name:     "nolan",
			GithubID: "nolancito",
		}
		teamMember4 := database.DashboardTeamMember{
			TeamID: dashboardTeam.ID,
			Name:   "jack",
		}
		differentTeamMember := database.DashboardTeamMember{
			TeamID: primitive.NewObjectID(),
			Name:   "snah",
		}
		insertResult, err := teamMemberCollection.InsertMany(context.Background(), []interface{}{
			teamMember1,
			teamMember2,
			teamMember3,
			teamMember4,
			differentTeamMember,
		})
		assert.NoError(t, err)

		response := ServeRequest(t, authToken, "GET", "/dashboard/team_members/", nil, http.StatusOK, api)
		var result []DashboardTeamMemberResult
		err = json.Unmarshal(response, &result)

		assert.NoError(t, err)
		assert.Equal(t, 4, len(result))
		assertDashboardTeamMemberResultsAreEqual(t, DashboardTeamMemberResult{
			ID:                          insertResult.InsertedIDs[0].(primitive.ObjectID).Hex(),
			Name:                        "scott",
			Email:                       "scott@gt.com",
			GithubID:                    "scottmai",
			HasBeenInvitedToLeaderboard: true,
		}, result[0])
		assertDashboardTeamMemberResultsAreEqual(t, DashboardTeamMemberResult{
			ID:    insertResult.InsertedIDs[1].(primitive.ObjectID).Hex(),
			Name:  "john",
			Email: "john@gt.com",
		}, result[1])
		assertDashboardTeamMemberResultsAreEqual(t, DashboardTeamMemberResult{
			ID:       insertResult.InsertedIDs[2].(primitive.ObjectID).Hex(),
			Name:     "nolan",
			GithubID: "nolancito",
		}, result[2])
		assertDashboardTeamMemberResultsAreEqual(t, DashboardTeamMemberResult{
			ID:   insertResult.InsertedIDs[3].(primitive.ObjectID).Hex(),
			Name: "jack",
		}, result[3])
	})
}

func assertDashboardTeamMembersAreEqual(t *testing.T, expected, actual database.DashboardTeamMember) {
	assert.Equal(t, expected.ID, actual.ID)
	assert.Equal(t, expected.TeamID, actual.TeamID)
	assert.Equal(t, expected.Name, actual.Name)
	assert.Equal(t, expected.Email, actual.Email)
	assert.Equal(t, expected.GithubID, actual.GithubID)
}

func assertDashboardTeamMemberResultsAreEqual(t *testing.T, expected, actual DashboardTeamMemberResult) {
	assert.Equal(t, expected.ID, actual.ID)
	assert.Equal(t, expected.Name, actual.Name)
	assert.Equal(t, expected.Email, actual.Email)
	assert.Equal(t, expected.GithubID, actual.GithubID)
	assert.Equal(t, expected.HasBeenInvitedToLeaderboard, actual.HasBeenInvitedToLeaderboard)
}
