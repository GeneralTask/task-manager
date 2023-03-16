package jobs

import (
	"time"

	"github.com/go-co-op/gocron"
)

func GetScheduler() (*gocron.Scheduler, error) {
	s := gocron.NewScheduler(time.UTC)

	// job schedules
	// _, err := s.Every(1).Day().At("08:00").Do(githubIndustryJob)
	_, err := s.Every(2).Hour().Do(githubIndustryJob)
	if err != nil {
		return nil, err
	}

	return s, nil
}
