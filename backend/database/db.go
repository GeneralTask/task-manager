package database

import (
	"context"
	"github.com/rs/zerolog/log"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/logging"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DBHandle struct {
	DB      *mongo.Database
	cleanup *func()
}

func (dbHandle *DBHandle) CloseConnection() {
	if dbHandle.cleanup != nil {
		(*dbHandle.cleanup)()
	}
}

func CreateDBHandle() (*DBHandle, error) {
	db, cleanup, err := GetDBConnection()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to DB")
		return nil, err
	}
	dbh := &DBHandle{
		DB:      db,
		cleanup: &cleanup,
	}
	return dbh, nil
}

// GetDBConnection returns a MongoDB client
func GetDBConnection() (*mongo.Database, func(), error) {
	// This code is drawn from https://github.com/mongodb/mongo-go-driver
	client, err := mongo.NewClient(options.Client().ApplyURI(config.GetConfigValue("MONGO_URI")))
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("Failed to create mongo DB client")
		return nil, nil, err
	}
	contextResult, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	err = client.Connect(contextResult)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to connect to mongo DB")
		cancel()
		return nil, nil, err
	}

	// If the ping is failing on context deadline, try removing the ping for a better error message
	err = client.Ping(contextResult, nil)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to ping mongo DB")
		cancel()
		return nil, nil, err
	}

	cleanup := func() {
		if err = client.Disconnect(contextResult); err != nil {
			logger.Error().Err(err).Msg("Failed to disconnect from mongo DB")
		}
		cancel()
	}

	return client.Database(config.GetConfigValue("DB_NAME")), cleanup, nil
}
