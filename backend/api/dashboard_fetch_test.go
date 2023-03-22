package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestDashboardFetch(t *testing.T) {
	authToken := login("test_dashboard_fetch@generaltask.com", "")
	UnauthorizedTest(t, "GET", "/dashboard/data/fetch/", nil)
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	testTime := time.Date(2023, time.January, 4, 20, 0, 0, 0, time.UTC)
	api.OverrideTime = &testTime
	router := GetRouter(api)

	userID := getUserIDFromAuthToken(t, api.DB, authToken)
	team, err := database.GetOrCreateDashboardTeam(api.DB, userID)
	assert.NoError(t, err)

	// wrong team
	team2, err := database.GetOrCreateDashboardTeam(api.DB, primitive.NewObjectID())
	assert.NoError(t, err)

	dashboardTeamMemberCollection := database.GetDashboardTeamMemberCollection(api.DB)
	res, err := dashboardTeamMemberCollection.InsertOne(context.Background(), database.DashboardTeamMember{TeamID: team.ID, GithubID: "elon123"})
	assert.NoError(t, err)
	teamMemberID := res.InsertedID.(primitive.ObjectID)

	res2, err := dashboardTeamMemberCollection.InsertOne(context.Background(), database.DashboardTeamMember{TeamID: team.ID, GithubID: "dogelord"})
	assert.NoError(t, err)
	teamMember2ID := res2.InsertedID.(primitive.ObjectID)
	// missing github ID
	_, err = dashboardTeamMemberCollection.InsertOne(context.Background(), database.DashboardTeamMember{TeamID: team.ID})
	assert.NoError(t, err)

	// wrong team ID
	_, err = dashboardTeamMemberCollection.InsertOne(context.Background(), database.DashboardTeamMember{TeamID: team2.ID, GithubID: "nole321"})
	assert.NoError(t, err)

	pullRequestCollection := database.GetPullRequestCollection(api.DB)
	// wrong user ID
	_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
		IDExternal:        "#1",
		SourceID:          "github_pr",
		UserID:            primitive.NewObjectID(),
		CreatedAtExternal: primitive.NewDateTimeFromTime(time.Date(2022, time.December, 28, 20, 0, 0, 0, time.UTC)),
		Author:            "gigachad",
		Comments: []database.PullRequestComment{{
			Author:    "elon123",
			CreatedAt: primitive.NewDateTimeFromTime(time.Date(2022, time.December, 28, 21, 0, 0, 0, time.UTC)),
		}},
	})
	assert.NoError(t, err)

	// out of cutoff range
	_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
		IDExternal:        "#2",
		SourceID:          "github_pr",
		UserID:            userID,
		CreatedAtExternal: primitive.NewDateTimeFromTime(time.Date(2021, time.December, 28, 20, 0, 0, 0, time.UTC)),
		Author:            "gigachad",
		Comments: []database.PullRequestComment{{
			Author:    "elon123",
			CreatedAt: primitive.NewDateTimeFromTime(time.Date(2021, time.December, 28, 21, 0, 0, 0, time.UTC)),
		}},
	})
	assert.NoError(t, err)

	// wrong team member
	_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
		IDExternal:        "#3",
		SourceID:          "github_pr",
		UserID:            userID,
		CreatedAtExternal: primitive.NewDateTimeFromTime(time.Date(2022, time.December, 28, 20, 0, 0, 0, time.UTC)),
		Author:            "gigachad",
		Comments: []database.PullRequestComment{{
			Author:    "nole321",
			CreatedAt: primitive.NewDateTimeFromTime(time.Date(2022, time.December, 28, 21, 0, 0, 0, time.UTC)),
		}},
	})
	assert.NoError(t, err)

	_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
		IDExternal:        "#4",
		SourceID:          "github_pr",
		UserID:            userID,
		CreatedAtExternal: primitive.NewDateTimeFromTime(time.Date(2022, time.December, 28, 20, 0, 0, 0, time.UTC)),
		Author:            "gigachad",
		Comments: []database.PullRequestComment{{
			Author:    "elon123",
			CreatedAt: primitive.NewDateTimeFromTime(time.Date(2022, time.December, 28, 21, 0, 0, 0, time.UTC)),
		}},
	})
	assert.NoError(t, err)
	_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
		IDExternal:        "#5",
		SourceID:          "github_pr",
		UserID:            userID,
		CreatedAtExternal: primitive.NewDateTimeFromTime(time.Date(2022, time.December, 28, 20, 0, 0, 0, time.UTC)),
		Author:            "gigachad",
		Comments: []database.PullRequestComment{{
			Author:    "elon123",
			CreatedAt: primitive.NewDateTimeFromTime(time.Date(2022, time.December, 28, 22, 0, 0, 0, time.UTC)),
		}},
	})
	assert.NoError(t, err)
	_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
		IDExternal:        "#6",
		SourceID:          "github_pr",
		UserID:            userID,
		CreatedAtExternal: primitive.NewDateTimeFromTime(time.Date(2022, time.December, 28, 20, 0, 0, 0, time.UTC)),
		Author:            "gigachad",
		Comments: []database.PullRequestComment{{
			Author:    "dogelord",
			CreatedAt: primitive.NewDateTimeFromTime(time.Date(2022, time.December, 28, 24, 0, 0, 0, time.UTC)),
		}},
	})
	assert.NoError(t, err)

	NoBusinessAccessTest(t, "GET", "/dashboard/data/fetch/", api, authToken)
	EnableBusinessAccess(t, api, userID)

	t.Run("Success", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/dashboard/data/fetch/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dashboardDataPointCollection := database.GetDashboardDataPointCollection(api.DB)
		cursor, err := dashboardDataPointCollection.Find(
			context.Background(),
			bson.M{"team_id": team.ID},
		)
		assert.NoError(t, err)
		var dashboardDataPoints []database.DashboardDataPoint
		err = cursor.All(context.Background(), &dashboardDataPoints)
		assert.NoError(t, err)
		assert.Equal(t, 3, len(dashboardDataPoints))
		// first team member
		assert.Equal(t, team.ID, dashboardDataPoints[0].TeamID)
		assert.Equal(t, teamMemberID, dashboardDataPoints[0].IndividualID)
		assert.Equal(t, constants.DashboardGraphTypePRResponseTime, dashboardDataPoints[0].GraphType)
		assert.Equal(t, 90, dashboardDataPoints[0].Value)
		// second team member
		assert.Equal(t, team.ID, dashboardDataPoints[1].TeamID)
		assert.Equal(t, teamMember2ID, dashboardDataPoints[1].IndividualID)
		assert.Equal(t, constants.DashboardGraphTypePRResponseTime, dashboardDataPoints[1].GraphType)
		assert.Equal(t, 240, dashboardDataPoints[1].Value)
		// team average
		assert.Equal(t, team.ID, dashboardDataPoints[2].TeamID)
		assert.Equal(t, primitive.NilObjectID, dashboardDataPoints[2].IndividualID)
		assert.Equal(t, constants.DashboardGraphTypePRResponseTime, dashboardDataPoints[2].GraphType)
		assert.Equal(t, 140, dashboardDataPoints[2].Value)
	})
}
