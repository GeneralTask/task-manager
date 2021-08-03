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
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// AtlassianAuthToken ...
type AtlassianAuthToken struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// AtlassianConfig ...
type AtlassianConfig struct {
	APIBaseURL      *string
	CloudIDURL      *string
	TokenURL        *string
	TransitionURL   *string
	PriorityListURL *string
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

func (atlassian AtlassianService) GetLinkURL(userID primitive.ObjectID, stateTokenID primitive.ObjectID) (*string, error) {
	authURL := "https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=" + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + "&scope=offline_access%20read%3Ajira-user%20read%3Ajira-work%20write%3Ajira-work&redirect_uri=" + config.GetConfigValue("SERVER_URL") + "authorize%2Fjira%2Fcallback%2F&state=" + stateTokenID.Hex() + "&response_type=code&prompt=consent"
	return &authURL, nil
}

func (atlassian AtlassianService) GetSignupURL(forcePrompt bool) (*string, *string, error) {
	return nil, nil, errors.New("atlassian does not support signup")
}

func (atlassian AtlassianService) HandleLinkCallback(code string, userID primitive.ObjectID) error {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	params := []byte(`{"grant_type": "authorization_code","client_id": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + `","client_secret": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_SECRET") + `","code": "` + code + `","redirect_uri": "` + config.GetConfigValue("SERVER_URL") + `authorize/jira/callback/"}`)
	tokenURL := "https://auth.atlassian.com/oauth/token"
	if atlassian.Config.TokenURL != nil {
		tokenURL = *atlassian.Config.TokenURL
	}
	req, err := http.NewRequest("POST", tokenURL, bytes.NewBuffer(params))
	if err != nil {
		return errors.New("error forming token request")
	}
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return errors.New("failed to request token")
	}
	tokenString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return errors.New("failed to read token response")
	}
	if resp.StatusCode != 200 {
		return errors.New("authorization failed")
	}

	var token AtlassianAuthToken
	err = json.Unmarshal(tokenString, &token)
	if err != nil {
		return errors.New("failed to read token response")
	}

	siteConfiguration := atlassian.getSites(&token)

	if siteConfiguration == nil {
		return errors.New("failed to download site configuration")
	}

	externalAPITokenCollection := db.Collection("external_api_tokens")
	accountID := (*siteConfiguration)[0].ID
	_, err = externalAPITokenCollection.UpdateOne(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"source": database.TaskSourceJIRA.Name},
			{"account_id": accountID},
		}},
		bson.M{"$set": &database.ExternalAPIToken{
			UserID:       userID,
			Source:       database.TaskSourceJIRA.Name,
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

	siteCollection := db.Collection("jira_site_collection")

	_, err = siteCollection.UpdateOne(
		context.TODO(),
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

func (atlassian AtlassianService) HandleSignupCallback(code string, stateTokenID primitive.ObjectID, userID primitive.ObjectID) error {
	return errors.New("atlassian does not support signup")
}

func (atlassian AtlassianService) getSites(token *AtlassianAuthToken) *[]AtlassianSite {
	cloudIDURL := "https://api.atlassian.com/oauth/token/accessible-resources"
	if atlassian.Config.CloudIDURL != nil {
		cloudIDURL = *atlassian.Config.CloudIDURL
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
	var siteConfiguration database.AtlassianSiteConfiguration
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return nil, err
	}
	defer dbCleanup()

	siteCollection := db.Collection("jira_site_collection")
	err = siteCollection.FindOne(context.TODO(), bson.M{"user_id": userID}).Decode(&siteConfiguration)
	if err != nil {
		return nil, err
	}
	return &siteConfiguration, nil
}

func (atlassian AtlassianService) getToken(userID primitive.ObjectID, accountID string) (*AtlassianAuthToken, error) {
	var JIRAToken database.ExternalAPIToken

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return nil, err
	}
	defer dbCleanup()

	externalAPITokenCollection := db.Collection("external_api_tokens")

	err = externalAPITokenCollection.FindOne(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"source": database.TaskSourceJIRA.Name},
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
	if atlassian.Config.TokenURL != nil {
		tokenURL = *atlassian.Config.TokenURL
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
