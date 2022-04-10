package config

import (
	"github.com/rs/zerolog/log"
	"os"

	"github.com/joho/godotenv"
)

type Environment int

const (
	Undefined Environment = iota
	Dev
	Prod
)

func GetEnvironment() Environment {
	environmentMap := map[string]Environment{
		"dev":  Dev,
		"prod": Prod,
	}
	if env, ok := environmentMap[GetConfigValue("ENVIRONMENT")]; ok {
		return env
	}
	log.Fatal().Msgf("env `ENVIRONMENT=%s` is not valid", GetConfigValue("ENVIRONMENT"))
	return Undefined
}

func (env Environment) String() string {
	switch env {
	case Dev:
		return "dev"
	case Prod:
		return "prod"
	}
	return "unknown"
}

func GetConfigValue(key string) string {
	// Works if running main.go
	err := godotenv.Load(".env")
	if err != nil {
		// Works if running config_test.go
		err = godotenv.Load("../.env")
		if err != nil {
			// In nearly all cases, we don't want to crash the server for an error, but failing to load the config
			// file is one place where crashing makes sense.
			log.Fatal().Err(err).Msg("Error loading .env file")
		}
	}
	return os.Getenv(key)
}
