package main

import (
	"context"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetDBConnection returns a MongoDB client
func GetDBConnection() (*mongo.Database, func()) {
	// This code is drawn from https://github.com/mongodb/mongo-go-driver
	client, err := mongo.NewClient(options.Client().ApplyURI("mongodb://root:example@localhost:27017"))
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

// Retrieve the google oauth token from the database based on the user of the
// current context.
func (api *API) getExternalAPITokenFromCtx(c *gin.Context, t *ExternalAPIToken) error {
	db, dbCleanup := GetDBConnection()
	defer dbCleanup()

	externalAPITokenCollection := db.Collection("external_api_tokens")
	userID := tokenMiddlewareGetUserID(c)
	err := externalAPITokenCollection.FindOne(nil, bson.D{{Key: "user_id", Value: userID}}).Decode(&t)
	if err != nil {
		return err
	}
	return nil
}
