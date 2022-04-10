package database

import (
	"context"
	"github.com/rs/zerolog/log"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetDBConnection returns a MongoDB client
func GetDBConnection() (*mongo.Database, func(), error) {
	// This code is drawn from https://github.com/mongodb/mongo-go-driver
	client, err := mongo.NewClient(options.Client().ApplyURI(config.GetConfigValue("MONGO_URI")))
	if err != nil {
		log.Info().Msgf("Failed to create mongo DB client: %v", err)
		return nil, nil, err
	}
	contextResult, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	err = client.Connect(contextResult)
	if err != nil {
		log.Info().Msgf("Failed to connect to mongo DB: %v", err)
		cancel()
		return nil, nil, err
	}

	// If the ping is failing on context deadline, try removing the ping for a better error message
	err = client.Ping(contextResult, nil)
	if err != nil {
		log.Info().Msgf("Failed to ping mongo DB: %v", err)
		cancel()
		return nil, nil, err
	}

	cleanup := func() {
		if err = client.Disconnect(contextResult); err != nil {
			log.Info().Msgf("Failed to disconnect from mongo DB: %v", err)
		}
		cancel()
	}

	return client.Database(config.GetConfigValue("DB_NAME")), cleanup, nil
}
