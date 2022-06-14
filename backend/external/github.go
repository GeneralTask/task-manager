package external

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/google/go-github/v45/github"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

type GithubConfigValues struct {
	UserInfoURL *string
}

type GithubConfig struct {
	OauthConfig  OauthConfigWrapper
	ConfigValues LinearConfigValues
}

type GithubService struct {
	Config GithubConfig
}

func getGithubConfig() *OauthConfig {
	return &OauthConfig{Config: &oauth2.Config{
		ClientID:     config.GetConfigValue("GITHUB_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("GITHUB_OAUTH_CLIENT_SECRET"),
		RedirectURL:  config.GetConfigValue("SERVER_URL") + "link/github/callback/",
		Scopes:       []string{"repo"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://github.com/login/oauth/authorize",
			TokenURL: "https://github.com/login/oauth/access_token",
		},
	}}
}

func GetGithubToken(externalAPITokenCollection *mongo.Collection, userID primitive.ObjectID, accountID string) (*oauth2.Token, error) {
	parentCtx := context.Background()
	var githubToken database.ExternalAPIToken

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	if err := externalAPITokenCollection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"service_id": TASK_SERVICE_ID_GITHUB},
			{"account_id": accountID},
		}}).Decode(&githubToken); err != nil {
		return nil, err
	}

	var token oauth2.Token
	json.Unmarshal([]byte(githubToken.Token), &token)
	return &token, nil
}

func (githubService GithubService) GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error) {
	authURL := githubService.Config.OauthConfig.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	return &authURL, nil
}

func (githubService GithubService) GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error) {
	return nil, errors.New("github does not support signup")
}

func (githubService GithubService) HandleLinkCallback(params CallbackParams, userID primitive.ObjectID) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return errors.New("internal server error")
	}
	defer dbCleanup()

	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	token, err := githubService.Config.OauthConfig.Exchange(extCtx, *params.Oauth2Code)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch token from Github")
		return errors.New("internal server error")
	}

	tokenString, err := json.Marshal(&token)
	log.Info().Msgf("token string: %s", string(tokenString))
	if err != nil {
		log.Error().Err(err).Msg("error parsing token")
		return errors.New("internal server error")
	}

	tokenSource := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: token.AccessToken},
	)
	tokenClient := oauth2.NewClient(extCtx, tokenSource)
	githubClient := github.NewClient(tokenClient)
	githubAccountID, err := getGithubAccountID(extCtx, CurrentlyAuthedUserFilter, githubClient, githubService.Config.ConfigValues.UserInfoURL)

	if err != nil {
		log.Error().Msg("failed to fetch Github user")
		log.Error().Msgf("error: %s", err)
		return nil
	}

	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	_, err = externalAPITokenCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{{"user_id": userID}, {"service_id": TASK_SERVICE_ID_GITHUB}}},
		bson.M{"$set": &database.ExternalAPIToken{
			UserID:         userID,
			ServiceID:      TASK_SERVICE_ID_GITHUB,
			Token:          string(tokenString),
			AccountID:      fmt.Sprint(githubAccountID),
			DisplayID:      "Github",
			IsUnlinkable:   true,
			IsPrimaryLogin: false,
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Error().Err(err).Msg("error saving token")
		return errors.New("internal server error")
	}
	return nil
}

func (github GithubService) HandleSignupCallback(params CallbackParams) (primitive.ObjectID, *bool, *string, error) {
	return primitive.NilObjectID, nil, nil, errors.New("github does not support signup")
}

func getGithubAccountID(context context.Context, currentlyAuthedUserFilter string, githubClient *github.Client, overrideURL *string) (int64, error) {
	if overrideURL != nil {
		overrideUrl, _ := url.Parse(fmt.Sprintf("%s/", *overrideURL))
		githubClient.BaseURL = overrideUrl
	}
	githubUser, _, err := githubClient.Users.Get(context, CurrentlyAuthedUserFilter)

	if err != nil || githubUser == nil {
		log.Error().Msg("failed to fetch Github user")
		log.Error().Msgf("error: %+v\n", err)
		return 0, errors.New("internal server error")
	}
	return githubUser.GetID(), nil
}
