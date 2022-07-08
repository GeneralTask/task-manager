package main

import (
	"github.com/GeneralTask/task-manager/backend/api"
	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/GeneralTask/task-manager/backend/migrations"
	"github.com/GeneralTask/task-manager/backend/utils"
	"github.com/rs/zerolog/log"
)

// @title           General Task API
// @version         0.1
// @description     Making knowledge workers more productive
// @termsOfService  https://generaltask.com/terms-of-service

// @contact.name   Support
// @contact.email  support@generaltask.com

// @host      localhost:8080
// @BasePath  /
func main() {
	env := config.GetEnvironment()
	utils.ConfigureLogger(env)
	log.Info().Msgf("Starting server in %s environment", env)
	// TODO: Validate .env/config at server startup

	err := migrations.RunMigrations("migrations")
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("error running migrations")
	}
	api.GetRouter(api.GetAPI()).Run()
}
