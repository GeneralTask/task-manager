package jobs

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/logging"
)

// get all calendar events
// for each user:
// detect timezone of the events
// set working hours to 9am-5pm
// look at time within those hours
func gcal_industry_job() {
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
	return nil
}
