package main

import (
	"fmt"
	"github.com/GeneralTask/task-manager/backend/api"
	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/migrations"
	"github.com/GeneralTask/task-manager/backend/utils"
	"github.com/rs/zerolog/log"
)

func main() {
	env := config.GetEnvironment()
	if env == config.Dev {
		log.Logger = utils.CreateConsoleLogger().With().Caller().Logger()
	}
	log.Printf("Starting server in %s environment", env)
	// TODO: Validate .env/config at server startup

	err := migrations.RunMigrations("migrations")
	if err != nil {
		fmt.Printf("error running migrations: %v", err)
	}
	api.GetRouter(api.GetAPI()).Run()
}
