package jobs

import (
	"context"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestUpdateGithubIndustryData(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	nowTime, _ := time.Parse(time.RFC3339, "2023-04-20T19:01:12Z")
	createdAtWithinRangeTime := nowTime.Add(-time.Hour * 24 * 5)
	createdAtWithinRange := primitive.NewDateTimeFromTime(createdAtWithinRangeTime)
	commentCreatedAt := primitive.NewDateTimeFromTime(createdAtWithinRangeTime.Add(time.Hour))
	commentCreatedAtSlow := primitive.NewDateTimeFromTime(createdAtWithinRangeTime.Add(2 * time.Hour))
	commentCreatedAtWrong := primitive.NewDateTimeFromTime(createdAtWithinRangeTime.Add(time.Minute))
	createdAtNotWithinRange := primitive.NewDateTimeFromTime(nowTime.Add(-time.Hour * 24 * 23))
	lastFetched := primitive.NewDateTimeFromTime(nowTime.Add(-time.Hour * 24 * 3))
	lastFetchedNewer := primitive.NewDateTimeFromTime(nowTime.Add(-time.Hour * 24 * 2))
	userID := primitive.NewObjectID()
	goodComments := []database.PullRequestComment{
		{
			Author:    "gigachad",
			CreatedAt: commentCreatedAtWrong,
		},
		{
			Author:    CODECOV_BOT,
			CreatedAt: commentCreatedAtWrong,
		},
		{
			Author:    "dogecoin",
			CreatedAt: commentCreatedAt,
		},
	}
	slowReviewComments := []database.PullRequestComment{{
		Author:    "dogecoin",
		CreatedAt: commentCreatedAtSlow,
	}}

	prOutOfRange := database.PullRequest{
		IDExternal:        "#1",
		SourceID:          "github_pr",
		UserID:            userID,
		LastFetched:       lastFetched,
		CreatedAtExternal: createdAtNotWithinRange,
		Author:            "gigachad",
		Comments:          goodComments,
	}
	assert.NoError(t, createTestPullRequest(db, prOutOfRange))
	prInRangeDuplicate := database.PullRequest{
		IDExternal:        "#2",
		SourceID:          "github_pr",
		UserID:            userID,
		LastFetched:       lastFetched,
		CreatedAtExternal: createdAtWithinRange,
		Author:            "gigachad",
		Comments:          slowReviewComments,
	}
	assert.NoError(t, createTestPullRequest(db, prInRangeDuplicate))
	prInRange := database.PullRequest{
		IDExternal:        "#2",
		SourceID:          "github_pr",
		UserID:            userID,
		LastFetched:       lastFetchedNewer,
		CreatedAtExternal: createdAtWithinRange,
		Author:            "gigachad",
		Comments:          goodComments,
	}
	assert.NoError(t, createTestPullRequest(db, prInRange))
	prInRange2 := database.PullRequest{
		IDExternal:        "#4",
		SourceID:          "github_pr",
		UserID:            userID,
		LastFetched:       lastFetchedNewer,
		CreatedAtExternal: createdAtWithinRange,
		Author:            "gigachad",
		Comments:          slowReviewComments,
	}
	assert.NoError(t, createTestPullRequest(db, prInRange2))
	prNoComments := database.PullRequest{
		IDExternal:        "#3",
		SourceID:          "github_pr",
		UserID:            userID,
		LastFetched:       lastFetched,
		CreatedAtExternal: createdAtWithinRange,
		Author:            "gigachad",
		Comments:          []database.PullRequestComment{},
	}
	assert.NoError(t, createTestPullRequest(db, prNoComments))

	t.Run("Success", func(t *testing.T) {
		assert.NoError(t, updateGithubIndustryData(nowTime, 21))

		dashboardDataPointCollection := database.GetDashboardDataPointCollection(db)
		cursor, err := dashboardDataPointCollection.Find(
			context.Background(),
			bson.M{},
		)
		assert.NoError(t, err)
		var dashboardDataPoints []database.DashboardDataPoint
		err = cursor.All(context.Background(), &dashboardDataPoints)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(dashboardDataPoints))
		assert.Equal(t, constants.DashboardSubjectGlobal, dashboardDataPoints[0].Subject)
		assert.Equal(t, constants.DashboardGraphTypePRResponseTime, dashboardDataPoints[0].GraphType)
		assert.Equal(t, 90, dashboardDataPoints[0].Value)
		expectedDateTime, _ := time.Parse(time.RFC3339, "2023-04-15T08:00:00Z")
		assert.Equal(t, primitive.NewDateTimeFromTime(expectedDateTime), dashboardDataPoints[0].Date)
	})
}

func createTestPullRequest(db *mongo.Database, pullRequest database.PullRequest) error {
	repositoryCollection := database.GetRepositoryCollection(db)
	_, err := repositoryCollection.InsertOne(context.Background(), pullRequest)
	return err
}
