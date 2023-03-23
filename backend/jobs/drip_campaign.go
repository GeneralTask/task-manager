package jobs

import (
	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/GeneralTask/task-manager/backend/utils"
)

func dripCampaignJob() {
	// want this to run hourly to ensure that we can send emails to users close to 9am in their timezone
	_, err := EnsureJobOnlyRunsOncePerHour("drip_campaign")
	if err != nil {
		return
	}
	err = utils.TestMailchimpEmail()
	if err != nil {
		logging.GetSentryLogger().Error().Err(err).Msg("failed to send drip campaign email")
		return
	}
}
