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

// JIRAAuthToken ...
type JIRAAuthToken struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// JIRAConfig ...
type JIRAConfig struct {
	APIBaseURL      *string
	CloudIDURL      *string
	TokenURL        *string
	TransitionURL   *string
	PriorityListURL *string
}

// JIRASite ...
type JIRASite struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	URL       string   `json:"url"`
	Scopes    []string `json:"scopes"`
	AvatarURL string   `json:"avatarUrl"`
}

type PriorityID struct {
	ID string `json:"id"`
}

type AtlassianService struct{}

func (atlassian AtlassianService) GetLinkAuthURL(userID primitive.ObjectID) (*string, error) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return nil, err
	}
	defer dbCleanup()
	insertedStateToken, err := database.CreateStateToken(db, &userID)
	if err != nil {
		return nil, err
	}

	authURL := "https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=" + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + "&scope=offline_access%20read%3Ajira-user%20read%3Ajira-work%20write%3Ajira-work&redirect_uri=" + config.GetConfigValue("SERVER_URL") + "authorize%2Fjira%2Fcallback%2F&state=" + *insertedStateToken + "&response_type=code&prompt=consent"
	return &authURL, nil
}

func (atlassian AtlassianService) HandleAuthCallback(code string, stateTokenID primitive.ObjectID, userID primitive.ObjectID, jiraConfig JIRAConfig) error {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	err = database.DeleteStateToken(db, stateTokenID, &userID)
	if err != nil {
		return errors.New("invalid state token")
	}

	params := []byte(`{"grant_type": "authorization_code","client_id": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + `","client_secret": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_SECRET") + `","code": "` + code + `","redirect_uri": "` + config.GetConfigValue("SERVER_URL") + `authorize/jira/callback/"}`)
	tokenURL := "https://auth.atlassian.com/oauth/token"
	if jiraConfig.TokenURL != nil {
		tokenURL = *jiraConfig.TokenURL
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

	var token JIRAAuthToken
	err = json.Unmarshal(tokenString, &token)
	if err != nil {
		return errors.New("failed to read token response")
	}

	siteConfiguration := getJIRASites(jiraConfig, &token)

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
		bson.M{"$set": database.JIRASiteConfiguration{
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

	err = GetListOfJIRAPriorities(jiraConfig, userID, token.AccessToken)
	if err != nil {
		log.Printf("failed to download priorities: %v", err)
		return errors.New("internal server error")
	}
	return nil
}

func getJIRASites(jiraConfig JIRAConfig, token *JIRAAuthToken) *[]JIRASite {
	cloudIDURL := "https://api.atlassian.com/oauth/token/accessible-resources"
	if jiraConfig.CloudIDURL != nil {
		cloudIDURL = *jiraConfig.CloudIDURL
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
	JIRASites := []JIRASite{}
	err = json.Unmarshal(cloudIDData, &JIRASites)
	if err != nil {
		log.Printf("failed to parse cloud ID response: %v", err)
		return nil
	}

	if len(JIRASites) == 0 {
		log.Println("no accessible JIRA resources found")
		return nil
	}
	return &JIRASites
}

func GetListOfJIRAPriorities(jiraConfig JIRAConfig, userID primitive.ObjectID, authToken string) error {
	var baseURL string
	if jiraConfig.PriorityListURL != nil {
		baseURL = *jiraConfig.PriorityListURL
	} else if siteConfiguration, _ := getJIRASiteConfiguration(userID); siteConfiguration != nil {
		baseURL = getJIRAAPIBaseURl(*siteConfiguration)
	} else {
		return errors.New("could not form base url")
	}

	url := baseURL + "/rest/api/3/priority/"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", "Bearer "+authToken)
	req.Header.Add("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)

	if err != nil {
		return err
	}
	priorityListString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var priorityIds []PriorityID
	err = json.Unmarshal(priorityListString, &priorityIds)

	if err != nil {
		return err
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()

	prioritiesCollection := db.Collection("jira_priorities")
	_, err = prioritiesCollection.DeleteMany(context.TODO(), bson.M{"user_id": userID})
	if err != nil {
		return err
	}

	var jiraPriorities []interface{}
	for index, object := range priorityIds {
		jiraPriorities = append(jiraPriorities, database.JIRAPriority{
			UserID:          userID,
			JIRAID:          object.ID,
			IntegerPriority: index + 1,
		})
	}
	_, err = prioritiesCollection.InsertMany(context.TODO(), jiraPriorities)
	return err
}

func getJIRAAPIBaseURl(siteConfiguration database.JIRASiteConfiguration) string {
	return "https://api.atlassian.com/ex/jira/" + siteConfiguration.CloudID
}

func getJIRASiteConfiguration(userID primitive.ObjectID) (*database.JIRASiteConfiguration, error) {
	var siteConfiguration database.JIRASiteConfiguration
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
