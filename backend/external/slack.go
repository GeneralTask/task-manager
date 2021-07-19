package external

import (
	"context"
	"encoding/json"
	"errors"
	"log"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

type SlackService struct {
	Config OauthConfigWrapper
}

func (Slack SlackService) GetLinkAuthURL(userID primitive.ObjectID) (*string, error) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		log.Printf("failed to get db: %v", err)
		return nil, err
	}
	defer dbCleanup()

	insertedStateToken, err := database.CreateStateToken(db, &userID)
	if err != nil || insertedStateToken == nil {
		log.Printf("failed to save state token: %v", err)
		return nil, err
	}

	authURL := Slack.Config.AuthCodeURL(*insertedStateToken, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	return &authURL, nil
}

func (Slack SlackService) HandleAuthCallback(code string, stateTokenID primitive.ObjectID, userID primitive.ObjectID) error {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return errors.New("internal server error")
	}
	defer dbCleanup()

	err = database.DeleteStateToken(db, stateTokenID, &userID)
	if err != nil {
		return errors.New("invalid state token")
	}

	token, err := Slack.Config.Exchange(context.Background(), code)

	if err != nil {
		log.Printf("failed to fetch token from Slack: %v", err)
		return errors.New("internal server error")
	}

	tokenString, err := json.Marshal(&token)

	if err != nil {
		log.Printf("error parsing token: %v", err)
		return errors.New("internal server error")
	}

	externalAPITokenCollection := db.Collection("external_api_tokens")
	_, err = externalAPITokenCollection.UpdateOne(
		context.TODO(),
		bson.M{"$and": []bson.M{{"user_id": userID}, {"source": database.TaskSourceSlack.Name}}},
		bson.M{"$set": &database.ExternalAPIToken{
			UserID: userID,
			Source: database.TaskSourceSlack.Name,
			Token:  string(tokenString)}},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		log.Printf("error saving token: %v", err)
		return errors.New("internal server error")
	}
	return nil
}
