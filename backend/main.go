package main

import (
	"github.com/GeneralTask/task-manager/backend/scheduler"

	"github.com/GeneralTask/task-manager/backend/api"
	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/migrations"
	"github.com/GeneralTask/task-manager/backend/utils"
	"github.com/rs/zerolog/log"
)

func printjk() {
	log.Println("jerd")
}

func main() {
	env := config.GetEnvironment()
	utils.ConfigureLogger(env)

	log.Info().Msgf("Starting server in %s environment", env)
	// TODO: Validate .env/config at server startup

	metricsJob := scheduler.NewScheduler(5, printjk)
	go metricsJob.Run()
	defer metricsJob.Stop()

	err := migrations.RunMigrations("migrations")
	if err != nil {
		log.Error().Msgf("error running migrations: %v", err)
	}
	api.GetRouter(api.GetAPI()).Run()
}
