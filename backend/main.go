package main

import (
	"fmt"
	"github.com/GeneralTask/task-manager/backend/scheduler"
	"log"

	"github.com/GeneralTask/task-manager/backend/api"
	"github.com/GeneralTask/task-manager/backend/migrations"
)

func printjk() {
	log.Println("jerd")
}

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	metricsJob := scheduler.NewScheduler(5, printjk)
	go metricsJob.Run()
	defer metricsJob.Stop()

	err := migrations.RunMigrations("migrations")
	if err != nil {
		fmt.Printf("error running migrations: %v", err)
	}
	api.GetRouter(api.GetAPI()).Run()
}
