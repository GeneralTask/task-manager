package jobs

import (
	"errors"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
)

// get all calendar events within range
// for each user, choose the calendar account with the most events
// determine the time zone and set the 9am to 5pm window
// look at time in >= 90 min blocks within those hours
func gcalIndustryJob() {
	logID, err := EnsureJobOnlyRunsOnceToday("gcal_industry")
	if err != nil {
		return
	}
	err = updateGcalIndustryData(logID, time.Now(), DEFAULT_LOOKBACK_DAYS)
	if err != nil {
		logging.GetSentryLogger().Error().Err(err).Msg("failed to run gcal industry data job")
		return
	}
}

func updateGcalIndustryData(logID primitive.ObjectID, endCutoff time.Time, lookbackDays int) error {
	logger := logging.GetSentryLogger()
	db, cleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer cleanup()
	err = database.InsertLogEvent(db, logID, "gcal_industry_job_start"+strconv.Itoa(lookbackDays)+" "+endCutoff.Format("2006-1-2 15:4:5"))
	if err != nil {
		logger.Error().Err(err).Msg("failed to log event")
	}

	calendarAccountToEvents, err := getCalendarEventsMapAfterCutoff(db, []bson.M{}, getDashboardCutoffTime(endCutoff, lookbackDays))
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch gcal events")
		return err
	}
	err = database.InsertLogEvent(db, logID, "gcal_industry_job_fetched_events"+strconv.Itoa(len(calendarAccountToEvents)))
	if err != nil {
		logger.Error().Err(err).Msg("failed to log event")
	}

	err = saveDataPointsForCalendarEvents(db, calendarAccountToEvents, primitive.NilObjectID, primitive.NilObjectID)
	if err != nil {
		return err
	}
	err = database.InsertLogEvent(db, logID, "gcal_industry_job_completed")
	if err != nil {
		logger.Error().Err(err).Msg("failed to log event")
	}
	return nil
}

func getCalendarEventsMapAfterCutoff(db *mongo.Database, filters []bson.M, cutoffTime time.Time) (map[string]database.PullRequest, error) {
	return nil, errors.New("a wittle fucky wucky")
}

func saveDataPointsForCalendarEvents(db *mongo.Database, calendarAccountToEvents map[string]database.PullRequest, teamID primitive.ObjectID, individualID primitive.ObjectID) error {
	return errors.New("oopsie whoopsie")
}
