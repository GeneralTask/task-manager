package api

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

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
	_, err = dashboardTeamMemberCollection.InsertOne(context.Background(), database.DashboardTeamMember{TeamID: team.ID, GithubID: "elon123"})
	assert.NoError(t, err)
	_, err = dashboardTeamMemberCollection.InsertOne(context.Background(), database.DashboardTeamMember{TeamID: team.ID, GithubID: "dogelord"})
	assert.NoError(t, err)
	// missing github ID
	_, err = dashboardTeamMemberCollection.InsertOne(context.Background(), database.DashboardTeamMember{TeamID: team.ID})
	assert.NoError(t, err)

	// wrong team ID
	_, err = dashboardTeamMemberCollection.InsertOne(context.Background(), database.DashboardTeamMember{TeamID: team2.ID, GithubID: "nole321"})
	assert.NoError(t, err)
	// teamMember2ID := res2.InsertedID.(primitive.ObjectID)

	pullRequestCollection := database.GetPullRequestCollection(api.DB)
	// wrong user ID
	_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
		IDExternal:        "#1",
		SourceID:          "github_pr",
		UserID:            primitive.NewObjectID(),
		CreatedAtExternal: primitive.NewDateTimeFromTime(time.Date(2023, time.December, 28, 20, 0, 0, 0, time.UTC)),
		Author:            "gigachad",
		Comments: []database.PullRequestComment{{
			Author:    "elon123",
			CreatedAt: primitive.NewDateTimeFromTime(time.Date(2023, time.December, 28, 21, 0, 0, 0, time.UTC)),
		}},
	})
	assert.NoError(t, err)

	// out of cutoff range
	_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
		IDExternal:        "#2",
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

	// wrong team member
	_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
		IDExternal:        "#3",
		SourceID:          "github_pr",
		UserID:            userID,
		CreatedAtExternal: primitive.NewDateTimeFromTime(time.Date(2023, time.December, 28, 20, 0, 0, 0, time.UTC)),
		Author:            "gigachad",
		Comments: []database.PullRequestComment{{
			Author:    "nole321",
			CreatedAt: primitive.NewDateTimeFromTime(time.Date(2023, time.December, 28, 21, 0, 0, 0, time.UTC)),
		}},
	})
	assert.NoError(t, err)

	_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
		IDExternal:        "#4",
		SourceID:          "github_pr",
		UserID:            userID,
		CreatedAtExternal: primitive.NewDateTimeFromTime(time.Date(2023, time.December, 28, 20, 0, 0, 0, time.UTC)),
		Author:            "gigachad",
		Comments: []database.PullRequestComment{{
			Author:    "elon123",
			CreatedAt: primitive.NewDateTimeFromTime(time.Date(2023, time.December, 28, 21, 0, 0, 0, time.UTC)),
		}},
	})
	assert.NoError(t, err)
	_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
		IDExternal:        "#5",
		SourceID:          "github_pr",
		UserID:            userID,
		CreatedAtExternal: primitive.NewDateTimeFromTime(time.Date(2023, time.December, 28, 20, 0, 0, 0, time.UTC)),
		Author:            "gigachad",
		Comments: []database.PullRequestComment{{
			Author:    "elon123",
			CreatedAt: primitive.NewDateTimeFromTime(time.Date(2023, time.December, 28, 22, 0, 0, 0, time.UTC)),
		}},
	})
	assert.NoError(t, err)
	_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
		IDExternal:        "#6",
		SourceID:          "github_pr",
		UserID:            userID,
		CreatedAtExternal: primitive.NewDateTimeFromTime(time.Date(2023, time.December, 28, 20, 0, 0, 0, time.UTC)),
		Author:            "gigachad",
		Comments: []database.PullRequestComment{{
			Author:    "dogelord",
			CreatedAt: primitive.NewDateTimeFromTime(time.Date(2023, time.December, 28, 23, 0, 0, 0, time.UTC)),
		}},
	})
	assert.NoError(t, err)
	/*
		PRs
		- wrong user id
		- out of cutoff time range
		- author not in team member list
		- 3 PRs with correct team members: two for one team member, one for another
	*/
	NoBusinessAccessTest(t, "GET", "/dashboard/data/fetch/", api, authToken)
	EnableBusinessAccess(t, api, userID)
	t.Run("Success", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/dashboard/data/fetch/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		assert.Equal(t, 1, 2)

		dashboardDataPointCollection := database.GetDashboardDataPointCollection(api.DB)
		cursor, err := dashboardDataPointCollection.Find(
			context.Background(),
			bson.M{"team_id": team.ID},
		)
		assert.NoError(t, err)
		var dashboardDataPoints []database.DashboardDataPoint
		err = cursor.All(context.Background(), &dashboardDataPoints)
		assert.NoError(t, err)
		fmt.Println("dashboard data points:", dashboardDataPoints)
		assert.Equal(t, 1, len(dashboardDataPoints))
	})
}
