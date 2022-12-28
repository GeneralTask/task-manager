package external

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/slack-go/slack"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

type SlackConfigValues struct {
	UserInfoURL      *string
	SavedMessagesURL *string
	OverrideURL      *string
}

type SlackConfig struct {
	OauthConfig  OauthConfigWrapper
	ConfigValues SlackConfigValues
}

type SlackService struct {
	Config SlackConfig
}

// guide for local testing: https://slack.dev/node-slack-sdk/tutorials/local-development
// slack api oauth page: https://api.slack.com/apps/A022SRD9GD9/oauth

func getSlackConfig() SlackConfig {
	return SlackConfig{
		OauthConfig: &OauthConfig{Config: &oauth2.Config{
			ClientID:     config.GetConfigValue("SLACK_OAUTH_CLIENT_ID"),
			ClientSecret: config.GetConfigValue("SLACK_OAUTH_CLIENT_SECRET"),
			RedirectURL:  config.GetConfigValue("SERVER_URL") + "link/slack/callback/",
			Scopes:       []string{"commands", "users:read"},
			Endpoint: oauth2.Endpoint{
				AuthURL:  "https://slack.com/oauth/authorize",
				TokenURL: "https://slack.com/api/oauth.access",
			},
		}}}
}

func GetSlackAppConfig() SlackConfig {
	return SlackConfig{
		OauthConfig: &OauthConfig{Config: &oauth2.Config{
			ClientID:     config.GetConfigValue("SLACK_OAUTH_CLIENT_ID"),
			ClientSecret: config.GetConfigValue("SLACK_OAUTH_CLIENT_SECRET"),
			RedirectURL:  config.GetConfigValue("SERVER_URL") + "link_app/slack/",
			Scopes:       []string{"commands", "users:read"},
			Endpoint: oauth2.Endpoint{
				AuthURL:  "https://slack.com/oauth/authorize",
				TokenURL: "https://slack.com/api/oauth.v2.access",
			},
		}}}
}

func (slackService SlackService) GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error) {
	authURL := slackService.Config.OauthConfig.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	return &authURL, nil
}

func (slackService SlackService) GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error) {
	return nil, errors.New("slack does not support signup")
}

func (slackService SlackService) HandleLinkCallback(db *mongo.Database, params CallbackParams, userID primitive.ObjectID) error {
	parentCtx := context.Background()

	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	token, err := slackService.Config.OauthConfig.Exchange(extCtx, *params.Oauth2Code)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch token from Slack")
		return errors.New("internal server error")
	}

	tokenString, err := json.Marshal(&token)
	if err != nil {
		logger.Error().Err(err).Msg("error parsing token")
		return errors.New("internal server error")
	}

	api := slack.New(token.AccessToken)
	if slackService.Config.ConfigValues.UserInfoURL != nil {
		api = slack.New(token.AccessToken, slack.OptionAPIURL(*slackService.Config.ConfigValues.UserInfoURL))
	}
	userInfo, err := api.AuthTest()
	if err != nil {
		logger.Error().Err(err).Msg("failed to get user identity")
		return errors.New("internal server error")
	}

	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	_, err = externalAPITokenCollection.UpdateOne(
		context.Background(),
		bson.M{"$and": []bson.M{{"user_id": userID}, {"service_id": TASK_SERVICE_ID_SLACK}, {"account_id": "todo"}}},
		bson.M{"$set": &database.ExternalAPIToken{
			UserID:         userID,
			ServiceID:      TASK_SERVICE_ID_SLACK,
			Token:          string(tokenString),
			AccountID:      fmt.Sprintf("%s-%s", userInfo.TeamID, userInfo.UserID),
			DisplayID:      fmt.Sprintf("%s (%s)", userInfo.User, userInfo.Team),
			IsUnlinkable:   true,
			IsPrimaryLogin: false,
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		logger.Error().Err(err).Msg("error saving token")
		return errors.New("internal server error")
	}
	return nil
}

func (slackService SlackService) HandleSignupCallback(db *mongo.Database, params CallbackParams) (primitive.ObjectID, *bool, *string, error) {
	return primitive.NilObjectID, nil, nil, errors.New("slack does not support signup")
}

func (slackService SlackService) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	return errors.New("has not been implemented yet")
}
