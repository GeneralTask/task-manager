package main

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetDBConnection returns a MongoDB client
func GetDBConnection() *mongo.Database {
	// This code is drawn from https://github.com/mongodb/mongo-go-driver
	client, err := mongo.NewClient(options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatalf("Failed to create mongo DB client: %v", err)
	}
	contextResult, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	err = client.Connect(contextResult)
	if err != nil {
		log.Fatalf("Failed to connect to mongo DB: %v", err)
	}

	err = client.Ping(contextResult, nil)
	if err != nil {
		log.Fatalf("Failed to ping mongo DB: %v", err)
	}

	defer func() {
		if err = client.Disconnect(contextResult); err != nil {
			log.Fatalf("Failed to disconnect from mongo DB: %v", err)
		}
	}()

	return client.Database("main")
}
