package jobs

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const CODECOV_BOT = "codecov[bot]"
const DEFAULT_LOOKBACK_DAYS = 21

func githubIndustryJob() {
	logID, err := EnsureJobOnlyRunsOnceToday("github_industry")
	if err != nil {
		return
	}
	err = updateGithubIndustryData(logID, time.Now(), DEFAULT_LOOKBACK_DAYS)
	if err != nil {
		logging.GetSentryLogger().Error().Err(err).Msg("failed to run github industry data job")
		return
	}
}

func updateGithubIndustryData(logID primitive.ObjectID, endCutoff time.Time, lookbackDays int) error {
	logger := logging.GetSentryLogger()
	db, cleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer cleanup()
	err = database.InsertLogEvent(db, logID, "github_industry_job_start"+strconv.Itoa(lookbackDays)+" "+endCutoff.Format("2006-1-2 15:4:5"))
	if err != nil {
		logger.Error().Err(err).Msg("failed to log event")
	}

	pullRequestIDToValue, err := getPullRequests(db, []bson.M{}, getPullRequestCutoffTime(endCutoff, lookbackDays))
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch github PRs")
		return err
	}
	err = database.InsertLogEvent(db, logID, "github_industry_job_fetched_prs"+strconv.Itoa(len(pullRequestIDToValue)))
	if err != nil {
		logger.Error().Err(err).Msg("failed to log event")
	}

	err = saveDataPointsForPullRequests(db, pullRequestIDToValue, primitive.NilObjectID, primitive.NilObjectID)
	if err != nil {
		return err
	}
	err = database.InsertLogEvent(db, logID, "github_industry_job_completed")
	if err != nil {
		logger.Error().Err(err).Msg("failed to log event")
	}
	return nil
}

func UpdateGithubTeamData(userID primitive.ObjectID, endCutoff time.Time, lookbackDays int) error {
	logger := logging.GetSentryLogger()
	db, cleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer cleanup()
	pullRequestIDToValue, err := getPullRequests(db, []bson.M{{"user_id": userID}}, getPullRequestCutoffTime(endCutoff, lookbackDays))
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch github PRs")
		return err
	}
	fmt.Println(pullRequestIDToValue)
	team, err := database.GetOrCreateDashboardTeam(db, userID)
	if err != nil {
		logger.Error().Err(err).Msg("failed to get dashboard team")
		return err
	}
	teamMembers, err := database.GetDashboardTeamMembers(db, team.ID)
	if err != nil || teamMembers == nil {
		logger.Error().Err(err).Msg("failed to get dashboard team members")
		return err
	}
	fmt.Println(teamMembers)
	// pullRequestsMatchingTeam := make(map[string]database.PullRequest)
	// teamMemberToPullRequests := make(map[primitive.ObjectID]map[string]database.PullRequest)
	authorToPullRequests := make(map[string]map[string]database.PullRequest)
	for _, pullRequest := range pullRequestIDToValue {
		for _, comment := range pullRequest.Comments {
			if comment.Author != CODECOV_BOT && comment.Author != pullRequest.Author {
				_, exists := authorToPullRequests[comment.Author]
				if !exists {
					authorToPullRequests[comment.Author] = make(map[string]database.PullRequest)
				}
				authorToPullRequests[comment.Author][pullRequest.IDExternal] = pullRequest
			}
		}
	}
	teamPullRequests := make(map[string]database.PullRequest)
	for _, teamMember := range *teamMembers {
		if teamMember.GithubID == "" {
			continue
		}
		idToPullRequest, exists := authorToPullRequests[teamMember.GithubID]
		if !exists {
			continue
		}
		err = saveDataPointsForPullRequests(db, idToPullRequest, team.ID, teamMember.ID)
		if err != nil {
			logger.Error().Err(err).Msgf("failed to save team %s member %s data points", team.ID, teamMember.ID)
			return err
		}
		for externalID, pullRequest := range idToPullRequest {
			teamPullRequests[externalID] = pullRequest
		}
	}
	saveDataPointsForPullRequests(db, teamPullRequests, team.ID, primitive.NilObjectID)
	return nil
}

func getPullRequests(db *mongo.Database, filters []bson.M, cutoffTime time.Time) (map[string]database.PullRequest, error) {
	pullRequestCollection := database.GetPullRequestCollection(db)
	findOptions := options.Find()
	// sort by increasing last_fetched, so the more recently updated PRs override the more stale PRs when looping through
	findOptions.SetSort(bson.D{{Key: "last_fetched", Value: 1}})
	filters = append(filters, bson.M{"created_at_external": bson.M{"$gte": cutoffTime}})
	cursor, err := pullRequestCollection.Find(
		context.Background(),
		bson.M{"$and": filters},
		findOptions,
	)
	if err != nil {
		return nil, err
	}
	var pullRequests []database.PullRequest
	err = cursor.All(context.Background(), &pullRequests)
	if err != nil {
		return nil, err
	}
	pullRequestIDToValue := make(map[string]database.PullRequest)
	for _, pullRequest := range pullRequests {
		pullRequestIDToValue[pullRequest.IDExternal] = pullRequest
	}
	return pullRequestIDToValue, nil
}

func saveDataPointsForPullRequests(db *mongo.Database, pullRequestIDToValue map[string]database.PullRequest, teamID primitive.ObjectID, individualID primitive.ObjectID) error {
	logger := logging.GetSentryLogger()
	dateToTotalResponseTime := make(map[primitive.DateTime]int)
	dateToPRCount := make(map[primitive.DateTime]int)
	for _, pullRequest := range pullRequestIDToValue {
		firstCommentTime := time.Time{}
		for _, comment := range pullRequest.Comments {
			if comment.Author != CODECOV_BOT && comment.Author != pullRequest.Author {
				firstCommentTime = comment.CreatedAt.Time()
				break
			}
		}
		if firstCommentTime.IsZero() {
			// skip pull requests with no comments
			continue
		}
		responseTime := int(firstCommentTime.Sub(pullRequest.CreatedAtExternal.Time()).Minutes())
		createdAt := pullRequest.CreatedAtExternal.Time()
		pullRequestDate := primitive.NewDateTimeFromTime(time.Date(createdAt.Year(), createdAt.Month(), createdAt.Day(), constants.UTC_OFFSET, 0, 0, 0, time.UTC))
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
			GraphType: constants.DashboardGraphTypePRResponseTime,
			Value:     averageResponseTime,
			Date:      dateTime,
			CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
		}
		if teamID != primitive.NilObjectID {
			dashboardDataPoint.TeamID = teamID
		}
		if individualID != primitive.NilObjectID {
			dashboardDataPoint.IndividualID = individualID
		}
		if teamID == primitive.NilObjectID && individualID == primitive.NilObjectID {
			dashboardDataPoint.Subject = constants.DashboardSubjectGlobal
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

func getPullRequestCutoffTime(endCutoff time.Time, lookbackDays int) time.Time {
	return endCutoff.Add(-time.Hour * 24 * time.Duration(lookbackDays))
}
