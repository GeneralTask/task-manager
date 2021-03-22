package main

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetDBConnection returns a MongoDB client
func GetDBConnection() (*mongo.Database, func()) {
	// This code is drawn from https://github.com/mongodb/mongo-go-driver
	mongoURI, mongoURIExists := os.LookupEnv("MONGO_URI")
	if !mongoURIExists {
		mongoURI = "mongodb://root:example@localhost:27017"
	}
	log.Println("Mongo URI:" + mongoURI)
	client, err := mongo.NewClient(options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to create mongo DB client: %v", err)
	}
	contextResult, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	err = client.Connect(contextResult)
	if err != nil {
		log.Fatalf("Failed to connect to mongo DB: %v", err)
	}

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
