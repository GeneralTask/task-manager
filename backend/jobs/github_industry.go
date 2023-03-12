package jobs

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func githubIndustryJob() error {
	logger := logging.GetSentryLogger()
	db, cleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer cleanup()

	repositoryCollection := database.GetRepositoryCollection(db)
	// find all PRs in the last week, sorted by last updated (and if external ID is same, choose one that's more recently updated)
	// group PRs by created_at_external date, and look at time to get first review comment (exclude codecov / auto comments)
	// author != codecov[bot]
	findOptions := options.Find()
	// sort by increasing last_fetched, so the more recently updated PRs override the more stale PRs when looping through
	findOptions.SetSort(bson.D{{Key: "last_fetched", Value: 1}})
	cursor, err := repositoryCollection.Find(
		context.Background(),
		bson.M{"created_at_external": bson.M{"$gte": time.Now().Add(-time.Hour * 24 * 21)}},
	)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch github PRs")
		return err
	}
	var pullRequests []database.PullRequest
	err = cursor.All(context.Background(), &pullRequests)
	if err != nil {
		logger.Error().Err(err).Msg("failed to iterate through github PRs")
		return err
	}
	pullRequestIDToValue := make(map[string]database.PullRequest)
	for _, pullRequest := range pullRequests {
		pullRequestIDToValue[pullRequest.IDExternal] = pullRequest
	}
	dateToTotalResponseTime := make(map[primitive.DateTime]int)
	dateToPRCount := make(map[primitive.DateTime]int)
	for _, pullRequest := range pullRequestIDToValue {
		// default if no comment yet
		firstCommentTime := time.Now()
		for _, comment := range pullRequest.Comments {
			if comment.Author != "codecov[bot]" {
				firstCommentTime = comment.CreatedAt.Time()
				break
			}
		}
		responseTime := int(pullRequest.CreatedAtExternal.Time().Sub(firstCommentTime).Minutes())
		createdAt := pullRequest.CreatedAtExternal.Time()
		pullRequestDate := primitive.NewDateTimeFromTime(time.Date(createdAt.Year(), createdAt.Month(), createdAt.Day(), 8, 0, 0, 0, time.UTC))
		dateToTotalResponseTime[pullRequestDate] += responseTime
		dateToPRCount[pullRequestDate] += 1
	}
	dataPointCollection := database.GetDashboardDataPointCollection(db)
	for dateTime, totalResponseTime := range dateToTotalResponseTime {
		pullRequestCount := dateToPRCount[dateTime]
		if pullRequestCount == 0 {
			logger.Error().Msg("pull request count is zero")
			return errors.New("pull request count is zero")
		}
		averageResponseTime := totalResponseTime / pullRequestCount
		dashboardDataPoint := database.DashboardDataPoint{
			Subject:   constants.DashboardSubjectGlobal,
			GraphType: constants.DashboardGraphTypePRResponseTime,
			Value:     averageResponseTime,
			Date:      dateTime,
			CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
		}
		result := dataPointCollection.FindOneAndUpdate(
			context.Background(),
			bson.M{"$and": []bson.M{
				{"subject": constants.DashboardSubjectGlobal},
				{"date": dateTime},
				{"graph_type": constants.DashboardGraphTypePRResponseTime},
			}},
			bson.M{"$set": dashboardDataPoint},
			options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After),
		)
		if result.Err() != nil {
			err := result.Err()
			logger.Error().Err(err).Msg("failed to update data point")
			return err
		}
	}
	return nil
}
