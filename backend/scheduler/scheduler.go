package scheduler

import (
	"fmt"
	"github.com/robfig/cron/v3"
	"log"
)

type Scheduler struct {
	cron *cron.Cron
}

func (scheduler *Scheduler) Run() {
	scheduler.cron.Run()
}

func (scheduler *Scheduler) Stop() {
	scheduler.cron.Stop()
}

func NewScheduler(interval int, functionToRun func()) *Scheduler {
	scheduler := Scheduler{cron: cron.New(cron.WithSeconds())}
	// TODO: change cron syntax to be every day at 12am PST
	_, err := scheduler.cron.AddFunc(fmt.Sprintf("@every %ds", interval), functionToRun)
	if err != nil {
		log.Fatalf("Cannot create scheduler, err: %+v", err)
	}
	return &scheduler
}
