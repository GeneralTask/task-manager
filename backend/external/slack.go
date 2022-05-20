package external

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/rs/zerolog/log"
	"github.com/slack-go/slack"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

type SlackService struct {
	Config OauthConfigWrapper
}

// guide for local testing: https://slack.dev/node-slack-sdk/tutorials/local-development
// slack api oauth page: https://api.slack.com/apps/A022SRD9GD9/oauth

func getSlackConfig() *OauthConfig {
	return &OauthConfig{Config: &oauth2.Config{
		ClientID:     config.GetConfigValue("SLACK_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("SLACK_OAUTH_CLIENT_SECRET"),
		RedirectURL:  config.GetConfigValue("SERVER_URL") + "link/slack/callback/",
		Scopes:       []string{"identify", "channels:history", "channels:read", "im:read", "mpim:history", "im:history", "groups:history", "groups:read", "mpim:write", "im:write", "channels:write", "groups:write", "chat:write:user"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://slack.com/oauth/authorize",
			TokenURL: "https://slack.com/api/oauth.access",
		},
	}}
}

func (slackService SlackService) GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error) {
	authURL := slackService.Config.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	return &authURL, nil
}

func (slackService SlackService) GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error) {
	return nil, errors.New("slack does not support signup")
}

func (slackService SlackService) HandleLinkCallback(params CallbackParams, userID primitive.ObjectID) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return errors.New("internal server error")
	}
	defer dbCleanup()

	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	token, err := slackService.Config.Exchange(extCtx, *params.Oauth2Code)
	if err != nil {
		log.Error().Msgf("failed to fetch token from Slack: %v", err)
		return errors.New("internal server error")
	}

	tokenString, err := json.Marshal(&token)
	if err != nil {
		log.Error().Msgf("error parsing token: %v", err)
		return errors.New("internal server error")
	}

	api := slack.New(token.AccessToken)
	api.GetUserIdentity()
	userInfo, err := api.AuthTest()
	if err != nil {
		log.Error().Msgf("failed to get user identity: %v", err)
		return errors.New("internal server error")
	}
	if userInfo != nil {
		fmt.Println("userInfo:", *userInfo, userInfo.User, userInfo.UserID)
	}

	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = externalAPITokenCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{{"user_id": userID}, {"service_id": TASK_SERVICE_ID_SLACK}, {"account_id": "todo"}}},
		bson.M{"$set": &database.ExternalAPIToken{
			UserID:         userID,
			ServiceID:      TASK_SERVICE_ID_SLACK,
			Token:          string(tokenString),
			AccountID:      userInfo.TeamID + userInfo.UserID,
			DisplayID:      fmt.Sprintf("%s (%s)", userInfo.User, userInfo.Team),
			IsUnlinkable:   true,
			IsPrimaryLogin: false,
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Error().Msgf("error saving token: %v", err)
		return errors.New("internal server error")
	}
	return nil
}

func (slackService SlackService) HandleSignupCallback(params CallbackParams) (primitive.ObjectID, *bool, *string, error) {
	return primitive.NilObjectID, nil, nil, errors.New("slack does not support signup")
}

func (slackService SlackService) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	return errors.New("has not been implemented yet")
}
