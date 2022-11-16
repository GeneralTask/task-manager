package external

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"

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

// AtlassianAuthToken ...
type AtlassianAuthToken struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

type AtlassianConfigValues struct {
	APIBaseURL      *string
	CloudIDURL      *string
	TokenURL        *string
	TransitionURL   *string
	PriorityListURL *string
}

// AtlassianConfig ...
type AtlassianConfig struct {
	OauthConfig  OauthConfigWrapper
	ConfigValues AtlassianConfigValues
}

// AtlassianSite ...
type AtlassianSite struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	URL       string   `json:"url"`
	Scopes    []string `json:"scopes"`
	AvatarURL string   `json:"avatarUrl"`
}

type PriorityID struct {
	ID string `json:"id"`
}

type AtlassianService struct {
	Config AtlassianConfig
}

func getAtlassianOauthConfig() OauthConfigWrapper {
	atlassianConfig := &oauth2.Config{
		ClientID:     config.GetConfigValue("JIRA_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("JIRA_OAUTH_CLIENT_SECRET"),
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://auth.atlassian.com/authorize",
			TokenURL: "https://auth.atlassian.com/oauth/token",
		},
		RedirectURL: config.GetConfigValue("SERVER_URL") + "link/atlassian/callback/",
		Scopes:      []string{"read:jira-work", "read:jira-user", "write:jira-work"},
	}
	return &OauthConfig{Config: atlassianConfig}
}

func (atlassian AtlassianService) GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error) {
	authURL := atlassian.Config.OauthConfig.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	authURL += "&audience=api.atlassian.com"
	return &authURL, nil
}

func (atlassian AtlassianService) GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error) {
	return nil, errors.New("atlassian does not support signup")
}

func (atlassian AtlassianService) HandleLinkCallback(db *mongo.Database, params CallbackParams, userID primitive.ObjectID) error {
	parentCtx := context.Background()

	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	token, err := atlassian.Config.OauthConfig.Exchange(extCtx, *params.Oauth2Code)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch token from Atlassian")
		return errors.New("internal server error")
	}

	tokenString, err := json.Marshal(&token)
	if err != nil {
		logger.Error().Err(err).Msg("error parsing token")
		return errors.New("internal server error")
	}

	siteConfiguration := atlassian.getSites(token)

	if siteConfiguration == nil {
		return errors.New("failed to download site configuration")
	}

	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	accountID := (*siteConfiguration)[0].ID
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = externalAPITokenCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"service_id": TASK_SERVICE_ID_ATLASSIAN},
			{"account_id": accountID},
		}},
		bson.M{"$set": &database.ExternalAPIToken{
			UserID:       userID,
			ServiceID:    TASK_SERVICE_ID_ATLASSIAN,
			Token:        string(tokenString),
			AccountID:    accountID,
			DisplayID:    (*siteConfiguration)[0].Name,
			IsUnlinkable: true,
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		logger.Error().Err(err).Msg("failed to create external token record")
		return errors.New("internal server error")
	}

	siteCollection := database.GetJiraSitesCollection(db)

	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = siteCollection.UpdateOne(
		dbCtx,
		bson.M{"user_id": userID},
		bson.M{"$set": database.AtlassianSiteConfiguration{
			UserID:  userID,
			CloudID: (*siteConfiguration)[0].ID,
			SiteURL: (*siteConfiguration)[0].URL,
		}},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		logger.Error().Err(err).Msg("failed to create external site collection record")
		return errors.New("internal server error")
	}

	JIRA := JIRASource{Atlassian: atlassian}
	err = JIRA.GetListOfPriorities(userID, token.AccessToken)
	if err != nil {
		logger.Error().Err(err).Msg("failed to download priorities")
		return errors.New("internal server error")
	}
	return nil
}

func (atlassian AtlassianService) HandleSignupCallback(db *mongo.Database, params CallbackParams) (primitive.ObjectID, *bool, *string, error) {
	return primitive.NilObjectID, nil, nil, errors.New("atlassian does not support signup")
}

func (atlassian AtlassianService) getSites(token *oauth2.Token) *[]AtlassianSite {
	cloudIDURL := "https://api.atlassian.com/oauth/token/accessible-resources"
	if atlassian.Config.ConfigValues.CloudIDURL != nil {
		cloudIDURL = *atlassian.Config.ConfigValues.CloudIDURL
	}
	req, err := http.NewRequest("GET", cloudIDURL, nil)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("error forming cloud ID request")
		return nil
	}
	req.Header.Add("Authorization", "Bearer "+token.AccessToken)
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		logger.Error().Err(err).Msg("failed to load cloud ID")
		return nil
	}
	cloudIDData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		logger.Error().Err(err).Msg("failed to read cloud ID response")
		return nil
	}
	if resp.StatusCode != 200 {
		logger.Error().Msgf("cloud ID request failed: %s", cloudIDData)
		return nil
	}
	AtlassianSites := []AtlassianSite{}
	err = json.Unmarshal(cloudIDData, &AtlassianSites)
	if err != nil {
		logger.Error().Err(err).Msg("failed to parse cloud ID response")
		return nil
	}

	if len(AtlassianSites) == 0 {
		logger.Error().Msg("no accessible JIRA resources found")
		return nil
	}
	return &AtlassianSites
}

func (atlassian AtlassianService) getSiteConfiguration(userID primitive.ObjectID) (*database.AtlassianSiteConfiguration, error) {
	parentCtx := context.Background()
	var siteConfiguration database.AtlassianSiteConfiguration
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return nil, err
	}
	defer dbCleanup()

	siteCollection := database.GetJiraSitesCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = siteCollection.FindOne(dbCtx, bson.M{"user_id": userID}).Decode(&siteConfiguration)
	if err != nil {
		return nil, err
	}
	return &siteConfiguration, nil
}

func (atlassian AtlassianService) getToken(userID primitive.ObjectID, accountID string) (*AtlassianAuthToken, error) {
	parentCtx := context.Background()
	var JIRAToken database.ExternalAPIToken

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return nil, err
	}
	defer dbCleanup()

	externalAPITokenCollection := database.GetExternalTokenCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = externalAPITokenCollection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"service_id": TASK_SERVICE_ID_ATLASSIAN},
			{"account_id": accountID},
		}}).Decode(&JIRAToken)

	if err != nil {
		return nil, err
	}

	var token AtlassianAuthToken
	err = json.Unmarshal([]byte(JIRAToken.Token), &token)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to parse JIRA token")
		return nil, err
	}
	params := []byte(`{"grant_type": "refresh_token","client_id": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + `","client_secret": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_SECRET") + `","refresh_token": "` + token.RefreshToken + `"}`)
	tokenURL := "https://auth.atlassian.com/oauth/token"
	if atlassian.Config.ConfigValues.TokenURL != nil {
		tokenURL = *atlassian.Config.ConfigValues.TokenURL
	}
	req, err := http.NewRequest("POST", tokenURL, bytes.NewBuffer(params))
	if err != nil {
		logger.Error().Err(err).Msg("error forming token request")
		return nil, err
	}
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		logger.Error().Err(err).Msg("failed to request token")
		return nil, err
	}
	tokenString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		logger.Error().Err(err).Msg("failed to read token response")
		return nil, err
	}
	if resp.StatusCode != 200 {
		logger.Error().Msgf("JIRA authorization failed: %s", tokenString)
		return nil, err
	}
	var newToken AtlassianAuthToken
	err = json.Unmarshal(tokenString, &newToken)
	if err != nil {
		logger.Error().Err(err).Msg("failed to parse new JIRA token")
		return nil, err
	}
	return &newToken, nil
}
