package external

import (
	"context"
	"encoding/json"
	"errors"
	"log"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

type SlackService struct {
	Config OauthConfigWrapper
}

func getSlackConfig() *OauthConfig {
	return &OauthConfig{Config: &oauth2.Config{
		ClientID:     config.GetConfigValue("SLACK_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("SLACK_OAUTH_CLIENT_SECRET"),
		RedirectURL:  "https://api.generaltask.io/authorize/slack/callback",
		Scopes:       []string{"channels:history", "channels:read", "im:read", "mpim:history", "im:history", "groups:history", "groups:read", "mpim:write", "im:write", "channels:write", "groups:write", "chat:write:user"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://slack.com/oauth/authorize",
			TokenURL: "https://slack.com/api/oauth.access",
		},
	}}
}

func (Slack SlackService) GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error) {
	authURL := Slack.Config.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	return &authURL, nil
}

func (Slack SlackService) GetSignupURL(forcePrompt bool) (*string, *string, error) {
	return nil, nil, errors.New("slack does not support signup")
}

func (Slack SlackService) HandleLinkCallback(code string, userID primitive.ObjectID) error {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return errors.New("internal server error")
	}
	defer dbCleanup()

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

func (Slack SlackService) HandleSignupCallback(code string, stateTokenID primitive.ObjectID, userID primitive.ObjectID) error {
	return errors.New("slack does not support signup")
}
