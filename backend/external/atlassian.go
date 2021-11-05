package external

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
		RedirectURL: config.GetConfigValue("SERVER_URL") + "link/jira/callback/",
		Scopes:      []string{"read:jira-work", "read:jira-user", "write:jira-work"},
	}
	return &OauthConfig{Config: atlassianConfig}
}

func (atlassian AtlassianService) GetLinkURL(userID primitive.ObjectID, stateTokenID primitive.ObjectID) (*string, error) {
	authURL := atlassian.Config.OauthConfig.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	authURL += "&audience=api.atlassian.com"
	return &authURL, nil
}

func (atlassian AtlassianService) GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error) {
	return nil, errors.New("atlassian does not support signup")
}

func (atlassian AtlassianService) HandleLinkCallback(params CallbackParams, userID primitive.ObjectID) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()

	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	token, err := atlassian.Config.OauthConfig.Exchange(extCtx, *params.Oauth2Code)
	if err != nil {
		log.Printf("failed to fetch token from Atlassian: %v", err)
		return errors.New("internal server error")
	}

	tokenString, err := json.Marshal(&token)
	if err != nil {
		log.Printf("error parsing token: %v", err)
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
		log.Printf("failed to create external token record: %v", err)
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
		log.Printf("failed to create external site collection record: %v", err)
		return errors.New("internal server error")
	}

	JIRA := JIRASource{Atlassian: atlassian}
	err = JIRA.GetListOfPriorities(userID, token.AccessToken)
	if err != nil {
		log.Printf("failed to download priorities: %v", err)
		return errors.New("internal server error")
	}
	return nil
}

func (atlassian AtlassianService) HandleSignupCallback(params CallbackParams) (primitive.ObjectID, *string, error) {
	return primitive.NilObjectID, nil, errors.New("atlassian does not support signup")
}

func (atlassian AtlassianService) getSites(token *oauth2.Token) *[]AtlassianSite {
	cloudIDURL := "https://api.atlassian.com/oauth/token/accessible-resources"
	if atlassian.Config.ConfigValues.CloudIDURL != nil {
		cloudIDURL = *atlassian.Config.ConfigValues.CloudIDURL
	}
	req, err := http.NewRequest("GET", cloudIDURL, nil)
	if err != nil {
		log.Printf("error forming cloud ID request: %v", err)
		return nil
	}
	req.Header.Add("Authorization", "Bearer "+token.AccessToken)
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("failed to load cloud ID: %v", err)
		return nil
	}
	cloudIDData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("failed to read cloud ID response: %v", err)
		return nil
	}
	if resp.StatusCode != 200 {
		log.Printf("cloud ID request failed: %s", cloudIDData)
		return nil
	}
	AtlassianSites := []AtlassianSite{}
	err = json.Unmarshal(cloudIDData, &AtlassianSites)
	if err != nil {
		log.Printf("failed to parse cloud ID response: %v", err)
		return nil
	}

	if len(AtlassianSites) == 0 {
		log.Println("no accessible JIRA resources found")
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
	if err != nil {
		log.Printf("failed to parse JIRA token: %v", err)
		return nil, err
	}
	params := []byte(`{"grant_type": "refresh_token","client_id": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + `","client_secret": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_SECRET") + `","refresh_token": "` + token.RefreshToken + `"}`)
	tokenURL := "https://auth.atlassian.com/oauth/token"
	if atlassian.Config.ConfigValues.TokenURL != nil {
		tokenURL = *atlassian.Config.ConfigValues.TokenURL
	}
	req, err := http.NewRequest("POST", tokenURL, bytes.NewBuffer(params))
	if err != nil {
		log.Printf("error forming token request: %v", err)
		return nil, err
	}
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("failed to request token: %v", err)
		return nil, err
	}
	tokenString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("failed to read token response: %v", err)
		return nil, err
	}
	if resp.StatusCode != 200 {
		log.Printf("JIRA authorization failed: %s", tokenString)
		return nil, err
	}
	var newToken AtlassianAuthToken
	err = json.Unmarshal(tokenString, &newToken)
	if err != nil {
		log.Printf("failed to parse new JIRA token: %v", err)
		return nil, err
	}
	return &newToken, nil
}
