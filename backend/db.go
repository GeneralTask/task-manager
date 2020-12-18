package main

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func getDBConnection() *mongo.Client {
	// This code is drawn from https://github.com/mongodb/mongo-go-driver
	client, err := mongo.NewClient(options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatalf("Failed to create mongo DB client: %v", err)
	}
	context, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	err = client.Connect(context)
	if err != nil {
		log.Fatalf("Failed to connect to mongo DB: %v", err)
	}

	defer func() {
		if err = client.Disconnect(context); err != nil {
			log.Fatalf("Failed to disconnect from mongo DB: %v", err)
		}
	}()

	return client
}
