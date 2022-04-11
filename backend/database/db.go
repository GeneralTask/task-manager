package database

import (
	"context"
	"log"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DBHandle struct {
	db      *mongo.Database
	cleanup *func()
}

var dbh *DBHandle

// InitDB sets up the connection pool global variable.
func InitDB(dbHandle *DBHandle) (*DBHandle, error) {
	var err error
	if dbHandle != nil {
		dbh = dbHandle
		return dbh, nil
	}

	dbh, err = createDBHandle()
	if err != nil {
		log.Printf("Failed to connect to db, %+v", err)
		return nil, err
	}
	return dbh, err
}

func GetDBConn() (*mongo.Database, error) {
	var err error
	if dbh != nil {
		return dbh.db, nil
	}

	dbh, err = InitDB(nil)
	if err != nil {
		log.Printf("Failed to init DB handler, %+v", err)
		return nil, err
	}
	return dbh.db, nil
}

func (dbHandle *DBHandle) CloseConnection() {
	if dbHandle.cleanup != nil {
		(*dbHandle.cleanup)()
	}
}

func createDBHandle() (*DBHandle, error) {
	db, cleanup, err := GetDBConnection()
	if err != nil {
		log.Printf("Failed to connect to db, %+v", err)
		// TODO: this should probably be fatal
		return nil, err
	}
	dbh = &DBHandle{
		db:      db,
		cleanup: &cleanup,
	}
	return dbh, nil
}

// GetDBConnection returns a MongoDB client
func GetDBConnection() (*mongo.Database, func(), error) {
	// This code is drawn from https://github.com/mongodb/mongo-go-driver
	client, err := mongo.NewClient(options.Client().ApplyURI(config.GetConfigValue("MONGO_URI")))
	if err != nil {
		log.Printf("Failed to create mongo DB client: %v", err)
		return nil, nil, err
	}
	contextResult, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	err = client.Connect(contextResult)
	if err != nil {
		log.Printf("Failed to connect to mongo DB: %v", err)
		cancel()
		return nil, nil, err
	}

	// If the ping is failing on context deadline, try removing the ping for a better error message
	err = client.Ping(contextResult, nil)
	if err != nil {
		log.Printf("Failed to ping mongo DB: %v", err)
		cancel()
		return nil, nil, err
	}

	cleanup := func() {
		if err = client.Disconnect(contextResult); err != nil {
			log.Printf("Failed to disconnect from mongo DB: %v", err)
		}
		cancel()
	}

	return client.Database(config.GetConfigValue("DB_NAME")), cleanup, nil
}
