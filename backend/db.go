package main

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetDBConnection returns a MongoDB client
func GetDBConnection() (*mongo.Database, func()) {
	// This code is drawn from https://github.com/mongodb/mongo-go-driver
	client, err := mongo.NewClient(options.Client().ApplyURI(GetConfigValue("MONGO_URI")))
	if err != nil {
		log.Fatalf("Failed to create mongo DB client: %v", err)
	}
	contextResult, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	err = client.Connect(contextResult)
	if err != nil {
		log.Fatalf("Failed to connect to mongo DB: %v", err)
	}

	// If the ping is failing on context deadline, try removing the ping for a better error message
	err = client.Ping(contextResult, nil)
	if err != nil {
		log.Fatalf("Failed to ping mongo DB: %v", err)
	}

	cleanup := func() {
		log.Println("disconnecting now! buh-bye!")
		if err = client.Disconnect(contextResult); err != nil {
			log.Fatalf("Failed to disconnect from mongo DB: %v", err)
		}
		cancel()
	}

	return client.Database("main"), cleanup
}
