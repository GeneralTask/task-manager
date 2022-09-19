package database

import (
	"context"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/logging"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DBHandle struct {
	DB      *mongo.Database
	cleanup *func()
}

const DB_CONNECTION_TIMEOUT = 10 * time.Second

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
	connectContext, cancel := context.WithTimeout(context.Background(), DB_CONNECTION_TIMEOUT)
	defer cancel()
	err = client.Connect(connectContext)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to connect to mongo DB")
		return nil, nil, err
	}

	// If the ping is failing on context deadline, try removing the ping for a better error message
	pingContext, cancel := context.WithTimeout(context.Background(), DB_CONNECTION_TIMEOUT)
	defer cancel()
	err = client.Ping(pingContext, nil)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to ping mongo DB")
		return nil, nil, err
	}

	cleanup := func() {
		disconnectContext, cancel := context.WithTimeout(context.Background(), DB_CONNECTION_TIMEOUT)
		defer cancel()
		if err = client.Disconnect(disconnectContext); err != nil {
			logger.Error().Err(err).Msg("Failed to disconnect from mongo DB")
		}
	}

	return client.Database(config.GetConfigValue("DB_NAME")), cleanup, nil
}
