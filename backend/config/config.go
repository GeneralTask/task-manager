package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func GetConfigValue(key string) string {
	// Works if running main.go
	err := godotenv.Load(".env")
	if err != nil {
		// Works if running config_test.go
		err = godotenv.Load("../.env")
		if err != nil {
			// In nearly all cases, we don't want to crash the server for an error, but failing to load the config
			// file is one place where crashing makes sense.
			log.Fatalf("Error loading .env file: %v", err)
		}
	}
	return os.Getenv(key)
}
