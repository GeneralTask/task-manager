package jobs

import (
	"time"

	"github.com/go-co-op/gocron"
)

func GetScheduler() *gocron.Scheduler {
	s := gocron.NewScheduler(time.UTC)

	// job schedules
	s.Every(1).Day().At("08:00").Do(helloworld)

	return s
}
