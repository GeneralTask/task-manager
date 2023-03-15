package jobs

import (
	"context"
	"errors"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const CODECOV_BOT = "codecov[bot]"
const DEFAULT_LOOKBACK_DAYS = 21

func githubIndustryJob() {
	err := EnsureJobOnlyRunsOnceToday("github_industry")
	if err != nil {
		return
	}
	err = updateGithubIndustryData(time.Now(), DEFAULT_LOOKBACK_DAYS)
	if err != nil {
		logging.GetSentryLogger().Error().Err(err).Msg("failed to run github industry data job")
		return
	}
}

func updateGithubIndustryData(endCutoff time.Time, lookbackDays int) error {
	logger := logging.GetSentryLogger()
	db, cleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer cleanup()
	database.InsertLogEvent(db, primitive.NilObjectID, "github_industry_job_start")

	repositoryCollection := database.GetRepositoryCollection(db)
	findOptions := options.Find()
	// sort by increasing last_fetched, so the more recently updated PRs override the more stale PRs when looping through
	findOptions.SetSort(bson.D{{Key: "last_fetched", Value: 1}})
	cursor, err := repositoryCollection.Find(
		context.Background(),
		bson.M{"created_at_external": bson.M{"$gte": endCutoff.Add(-time.Hour * 24 * time.Duration(lookbackDays))}},
		findOptions,
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
	database.InsertLogEvent(db, primitive.NilObjectID, "github_industry_job_fetched_prs"+strconv.Itoa(len(pullRequests)))
	pullRequestIDToValue := make(map[string]database.PullRequest)
	for _, pullRequest := range pullRequests {
		pullRequestIDToValue[pullRequest.IDExternal] = pullRequest
	}
	dateToTotalResponseTime := make(map[primitive.DateTime]int)
	dateToPRCount := make(map[primitive.DateTime]int)
	for _, pullRequest := range pullRequestIDToValue {
		firstCommentTime := endCutoff
		for _, comment := range pullRequest.Comments {
			if comment.Author != CODECOV_BOT && comment.Author != pullRequest.Author {
				firstCommentTime = comment.CreatedAt.Time()
				break
			}
		}
		if firstCommentTime == endCutoff {
			// skip pull requests with no comments
			continue
		}
		responseTime := int(firstCommentTime.Sub(pullRequest.CreatedAtExternal.Time()).Minutes())
		createdAt := pullRequest.CreatedAtExternal.Time()
		pullRequestDate := primitive.NewDateTimeFromTime(time.Date(createdAt.Year(), createdAt.Month(), createdAt.Day(), 8, 0, 0, 0, time.UTC))
		dateToTotalResponseTime[pullRequestDate] += responseTime
		dateToPRCount[pullRequestDate] += 1
	}
	database.InsertLogEvent(db, primitive.NilObjectID, "github_industry_job_calc_response_time"+strconv.Itoa(len(dateToTotalResponseTime)))
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
	database.InsertLogEvent(db, primitive.NilObjectID, "github_industry_job_completed")
	return nil
}
