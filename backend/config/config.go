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
			log.Fatal("Error loading .env file")
		}
	}
	return os.Getenv(key)
}
