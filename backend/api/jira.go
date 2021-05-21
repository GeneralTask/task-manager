package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"reflect"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
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
	APIBaseURL *string
	CloudIDURL *string
	TokenURL   *string
	TransitionURL *string
}

// JIRARedirectParams ...
type JIRARedirectParams struct {
	Code  string `form:"code"`
	State string `form:"state"`
}

// JIRASite ...
type JIRASite struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	URL       string   `json:"url"`
	Scopes    []string `json:"scopes"`
	AvatarURL string   `json:"avatarUrl"`
}

// JIRATask represents the API detail result for issues - only fields we need
type JIRATask struct {
	Fields JIRATaskFields `json:"fields"`
	ID     string         `json:"id"`
	Key    string         `json:"key"`
}

// JIRATaskFields ...
type JIRATaskFields struct {
	DueDate string `json:"duedate"`
	Summary string `json:"summary"`
}

// JIRATaskList represents the API list result for issues - only fields we need
type JIRATaskList struct {
	Issues []JIRATask `json:"issues"`
}

func (api *API) AuthorizeJIRA(c *gin.Context) {
	internalToken, err := getTokenFromCookie(c)
	if err != nil {
		return
	}
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	insertedStateToken := database.CreateStateToken(db, &internalToken.UserID)
	authURL := "https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=7sW3nPubP5vLDktjR2pfAU8cR67906X0&scope=offline_access%20read%3Ajira-user%20read%3Ajira-work%20write%3Ajira-work&redirect_uri=https%3A%2F%2Fapi.generaltask.io%2Fauthorize2%2Fjira%2Fcallback%2F&state=" + insertedStateToken + "&response_type=code&prompt=consent"
	c.Redirect(302, authURL)
}

func (api *API) AuthorizeJIRACallback(c *gin.Context) {
	internalToken, err := getTokenFromCookie(c)
	if err != nil {
		return
	}
	// See https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/
	var redirectParams JIRARedirectParams
	if c.ShouldBind(&redirectParams) != nil || redirectParams.Code == "" || redirectParams.State == "" {
		c.JSON(400, gin.H{"detail": "Missing query params"})
		return
	}
	stateTokenID, err := primitive.ObjectIDFromHex(redirectParams.State)
	if err != nil {
		c.JSON(400, gin.H{"detail": "Invalid state token format"})
		return
	}

	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	err = database.DeleteStateToken(db, stateTokenID, &internalToken.UserID)
	if err != nil {
		c.JSON(400, gin.H{"detail": "Invalid state token"})
		return
	}

	params := []byte(`{"grant_type": "authorization_code","client_id": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + `","client_secret": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_SECRET") + `","code": "` + redirectParams.Code + `","redirect_uri": "` + config.GetConfigValue("SERVER_URL") + `authorize/jira/callback/"}`)
	tokenURL := "https://auth.atlassian.com/oauth/token"
	if api.JIRAConfigValues.TokenURL != nil {
		tokenURL = *api.JIRAConfigValues.TokenURL
	}
	req, err := http.NewRequest("POST", tokenURL, bytes.NewBuffer(params))
	if err != nil {
		log.Printf("Error forming token request: %v", err)
		c.JSON(400, gin.H{"detail": "Error forming token request"})
		return
	}
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to request token: %v", err)
		c.JSON(400, gin.H{"detail": "Failed to request token"})
		return
	}
	tokenString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read token response: %v", err)
		c.JSON(400, gin.H{"detail": "Failed to read token response"})
		return
	}
	if resp.StatusCode != 200 {
		log.Printf("JIRA authorization failed: %s", tokenString)
		c.JSON(400, gin.H{"detail": "Authorization failed", "token": config.GetConfigValue("JIRA_OAUTH_CLIENT_ID")})
		return
	}

	var token JIRAAuthToken
	err = json.Unmarshal(tokenString, &token)
	if err != nil {
		c.JSON(400, gin.H{"detail": "Failed to read token response"})
		return
	}

	externalAPITokenCollection := db.Collection("external_api_tokens")

	_, err = externalAPITokenCollection.UpdateOne(
		context.TODO(),
		bson.D{{Key: "user_id", Value: internalToken.UserID}, {Key: "source", Value: "jira"}},
		bson.D{{Key: "$set", Value: &database.ExternalAPIToken{UserID: internalToken.UserID, Source: "jira", Token: string(tokenString)}}},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		log.Fatalf("Failed to create external token record: %v", err)
	}

	siteConfiguration := getJIRASites(api, &token)

	if siteConfiguration == nil {
		c.JSON(400, gin.H{"detail": "Failed to download site configuration"})
		return
	}


	siteCollection := db.Collection("jira_site_collection")

	_, err = siteCollection.UpdateOne(
		nil,
		bson.D{{"user_id", internalToken.UserID}},
		bson.D{{"$set",
			database.JIRASiteConfiguration{
				UserID:  internalToken.UserID,
				CloudID: (*siteConfiguration)[0].ID,
				SiteURL: (*siteConfiguration)[0].URL,
			},
		}},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		log.Fatalf("Failed to create external site collection record: %v", err)
	}

	c.Redirect(302, config.GetConfigValue("HOME_URL"))
}

func LoadJIRATasks(api *API, userID primitive.ObjectID, result chan<- []*database.Task) {
	authToken := getJIRAToken(api, userID)
	siteConfiguration := getJIRASiteConfiguration(userID)

	if authToken == nil || siteConfiguration == nil {
		result <- []*database.Task{}
		return
	}

	apiBaseURL := getJIRAAPIBaseURl(*siteConfiguration)
	if api.JIRAConfigValues.APIBaseURL != nil {
		apiBaseURL = *api.JIRAConfigValues.APIBaseURL
	}
	JQL := "assignee=currentuser() AND status != Done"
	req, err := http.NewRequest("GET", apiBaseURL+"/rest/api/2/search?jql="+url.QueryEscape(JQL), nil)
	if err != nil {
		log.Printf("Error forming search request: %v", err)
		result <- []*database.Task{}
		return
	}
	req.Header.Add("Authorization", "Bearer "+authToken.AccessToken)
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to load search results: %v", err)
		result <- []*database.Task{}
		return
	}
	taskData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read search response: %v", err)
		result <- []*database.Task{}
		return
	}
	if resp.StatusCode != 200 {
		log.Printf("Search failed: %s %v", taskData, resp.StatusCode)
		result <- []*database.Task{}
		return
	}

	var jiraTasks JIRATaskList
	err = json.Unmarshal(taskData, &jiraTasks)
	if err != nil {
		log.Printf("Failed to parse JIRA tasks: %v", err)
		result <- []*database.Task{}
		return
	}

	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()

	taskCollection := db.Collection("tasks")

	var tasks []*database.Task
	for _, jiraTask := range jiraTasks.Issues {
		task := &database.Task{
			TaskBase: database.TaskBase{
				UserID:         userID,
				IDExternal:     jiraTask.ID,
				Deeplink:       siteConfiguration.SiteURL + "/browse/" + jiraTask.Key,
				Source:         database.TaskSourceJIRA.Name,
				Title:          jiraTask.Fields.Summary,
				Logo:           database.TaskSourceJIRA.Logo,
				IsCompletable:  database.TaskSourceJIRA.IsCompletable,
				TimeAllocation: time.Hour.Nanoseconds(),
			},
		}
		dueDate, err := time.Parse("2006-01-02", jiraTask.Fields.DueDate)
		if err == nil {
			task.DueDate = primitive.NewDateTimeFromTime(dueDate)
		}
		dbTask := database.UpdateOrCreateTask(
			db,
			userID,
			task.IDExternal,
			task.Source,
			task,
			database.TaskChangeableFields{
				Title:    task.Title,
				DueDate:  task.DueDate,
				Priority: task.Priority,
			},
		)
		if dbTask != nil {
			task.ID = dbTask.ID
			task.IDOrdering = dbTask.IDOrdering
		}
		tasks = append(tasks, task)
	}
	result <- tasks
}

func getJIRAAPIBaseURl(siteConfiguration database.JIRASiteConfiguration) string {
	return "https://api.atlassian.com/ex/jira/" + siteConfiguration.CloudID
}

func getJIRASites(api *API, token *JIRAAuthToken) *[]JIRASite {
	cloudIDURL := "https://api.atlassian.com/oauth/token/accessible-resources"
	if api.JIRAConfigValues.CloudIDURL != nil {
		cloudIDURL = *api.JIRAConfigValues.CloudIDURL
	}
	req, err := http.NewRequest("GET", cloudIDURL, nil)
	if err != nil {
		log.Printf("Error forming cloud ID request: %v", err)
		return nil
	}
	req.Header.Add("Authorization", "Bearer "+token.AccessToken)
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to load cloud ID: %v", err)
		return nil
	}
	cloudIDData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read cloudID response: %v", err)
		return nil
	}
	if resp.StatusCode != 200 {
		log.Printf("CloudID request failed: %s", cloudIDData)
		return nil
	}
	JIRASites := []JIRASite{}
	err = json.Unmarshal(cloudIDData, &JIRASites)
	if err != nil {
		log.Printf("Failed to parse cloud ID response: %v", err)
		return nil
	}

	if len(JIRASites) == 0 {
		log.Println("No accessible JIRA resources found")
		return nil
	}
	return &JIRASites
}

func getJIRASiteConfiguration(userID primitive.ObjectID) *database.JIRASiteConfiguration {
	var siteConfiguration database.JIRASiteConfiguration
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()

	siteCollection := db.Collection("jira_site_collection")
	err := siteCollection.FindOne(nil, bson.D{{Key: "user_id", Value: userID}}).Decode(&siteConfiguration)
	if err != nil {
		return nil
	}
	return &siteConfiguration
}

func getJIRAToken(api *API, userID primitive.ObjectID) *JIRAAuthToken {
	var JIRAToken database.ExternalAPIToken

	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()

	externalAPITokenCollection := db.Collection("external_api_tokens")

	err := externalAPITokenCollection.FindOne(nil, bson.D{{Key: "user_id", Value: userID}, {Key: "source", Value: "jira"}}).Decode(&JIRAToken)
	if err != nil {
		return nil
	}

	var token JIRAAuthToken
	err = json.Unmarshal([]byte(JIRAToken.Token), &token)
	if err != nil {
		log.Printf("Failed to parse JIRA token: %v", err)
		return nil
	}
	params := []byte(`{"grant_type": "refresh_token","client_id": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + `","client_secret": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_SECRET") + `","refresh_token": "` + token.RefreshToken + `"}`)
	tokenURL := "https://auth.atlassian.com/oauth/token"
	if api.JIRAConfigValues.TokenURL != nil {
		tokenURL = *api.JIRAConfigValues.TokenURL
	}
	req, err := http.NewRequest("POST", tokenURL, bytes.NewBuffer(params))
	if err != nil {
		log.Printf("Error forming token request: %v", err)
		return nil
	}
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to request token: %v", err)
		return nil
	}
	tokenString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read token response: %v", err)
		return nil
	}
	if resp.StatusCode != 200 {
		log.Printf("JIRA authorization failed: %s", tokenString)
		return nil
	}
	var newToken JIRAAuthToken
	err = json.Unmarshal(tokenString, &newToken)
	if err != nil {
		log.Printf("Failed to parse new JIRA token: %v", err)
		return nil
	}
	return &newToken
}

func MarkJIRATaskDone(api *API, userID primitive.ObjectID, issueID string) bool {
	token := getJIRAToken(api, userID)
	siteConfiguration := getJIRASiteConfiguration(userID)
	if token == nil || siteConfiguration == nil {
		return false
	}

	//first get the list of transitions
	var apiBaseURL string

	if api.JIRAConfigValues.TransitionURL != nil {
		apiBaseURL = *api.JIRAConfigValues.TransitionURL
	} else {
		apiBaseURL = getJIRAAPIBaseURl(*siteConfiguration)
	}

	finalTransitionID := getFinalTransitionID(apiBaseURL, token.AccessToken, issueID)

	if finalTransitionID == nil {
		return false
	}

	return executeTransition(apiBaseURL, token.AccessToken, issueID, *finalTransitionID)
}

func getFinalTransitionID(apiBaseURL string, jiraAuthToken string, jiraCloudID string) *string {
	transitionsURL := apiBaseURL+"/rest/api/3/issue/" + jiraCloudID + "/transitions"

	req, _ := http.NewRequest("GET", transitionsURL, nil)
	req.Header.Add("Authorization", "Bearer "+jiraAuthToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to request transitions")
		return nil
	}

	responseString, err := ioutil.ReadAll(resp.Body)

	var data map[string]interface{}
	err = json.Unmarshal(responseString, &data)

	typeOfArray := reflect.TypeOf(data["transitions"]).String()
	fmt.Println(typeOfArray)
	transitionsArray, castResult := data["transitions"].([]interface{})
	if !castResult || len(transitionsArray) < 1 {
		return nil
	}
	lastTransition, castResult := transitionsArray[len(transitionsArray) - 1].(map[string]interface{})
	if !castResult {
		return nil
	}
	transitionID := lastTransition["id"]
	typedTransitionID, castResult := transitionID.(string)
	if !castResult {
		return nil
	}
	return &typedTransitionID
}

func executeTransition(apiBaseURL string, jiraAuthToken string, issueID string, newTransitionID string) bool {
	transitionsURL := apiBaseURL+"/rest/api/3/issue/" + issueID + "/transitions"
	params := []byte(`{"transition": {"id": "` + newTransitionID + `"}}`)
	req, _ := http.NewRequest("POST", transitionsURL, bytes.NewBuffer(params))
	req.Header.Add("Authorization", "Bearer "+jiraAuthToken)
	req.Header.Add("Content-Type", "application/json")

	_, err := http.DefaultClient.Do(req)
	return err == nil
}