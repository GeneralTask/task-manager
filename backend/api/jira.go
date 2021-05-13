package api

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
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
	AvatarURL string   `json:"avatarUrl`
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
	stateTokenCollection := db.Collection("state_tokens")
	cursor, err := stateTokenCollection.InsertOne(nil, &database.StateToken{UserID: internalToken.UserID})
	if err != nil {
		log.Fatalf("Failed to create new state token: %v", err)
	}
	insertedStateToken := cursor.InsertedID.(primitive.ObjectID).Hex()
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
	stateTokenCollection := db.Collection("state_tokens")
	result, err := stateTokenCollection.DeleteOne(nil, bson.D{{"user_id", internalToken.UserID}, {"_id", stateTokenID}})
	if err != nil {
		log.Fatalf("Failed to delete state token: %v", err)
	}
	if result.DeletedCount != 1 {
		c.JSON(400, gin.H{"detail": "Invalid state token"})
		return
	}

	params := []byte(`{"grant_type": "authorization_code","client_id": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + `","client_secret": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_SECRET") + `","code": "` + redirectParams.Code + `","redirect_uri": "https://api.generaltask.io/authorize2/jira/callback/"}`)
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
		c.JSON(400, gin.H{"detail": "Authorization failed"})
		return
	}

	externalAPITokenCollection := db.Collection("external_api_tokens")
	_, err = externalAPITokenCollection.UpdateOne(
		nil,
		bson.D{{"user_id", internalToken.UserID}, {"source", "jira"}},
		bson.D{{"$set", &database.ExternalAPIToken{UserID: internalToken.UserID, Source: "jira", Token: string(tokenString)}}},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		log.Fatalf("Failed to create external token record: %v", err)
	}

	c.Redirect(302, config.GetConfigValue("HOME_URL"))
}

func LoadJIRATasks(api *API, externalAPITokenCollection *mongo.Collection, userID primitive.ObjectID, result chan<- []*database.Task) {
	var JIRAToken database.ExternalAPIToken
	err := externalAPITokenCollection.FindOne(nil, bson.D{{Key: "user_id", Value: userID}, {Key: "source", Value: "jira"}}).Decode(&JIRAToken)
	if err != nil {
		// No JIRA token exists, so don't populate result
		result <- []*database.Task{}
		return
	}

	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	taskCollection := db.Collection("tasks")

	var token JIRAAuthToken
	err = json.Unmarshal([]byte(JIRAToken.Token), &token)
	if err != nil {
		log.Printf("Failed to parse JIRA token: %v", err)
		result <- []*database.Task{}
		return
	}
	params := []byte(`{"grant_type": "refresh_token","client_id": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + `","client_secret": "` + config.GetConfigValue("GOOGLE_OAUTH_CLIENT_SECRET") + `","refresh_token": "` + token.RefreshToken + `"}`)
	tokenURL := "https://auth.atlassian.com/oauth/token"
	if api.JIRAConfigValues.TokenURL != nil {
		tokenURL = *api.JIRAConfigValues.TokenURL
	}
	req, err := http.NewRequest("POST", tokenURL, bytes.NewBuffer(params))
	if err != nil {
		log.Printf("Error forming token request: %v", err)
		result <- []*database.Task{}
		return
	}
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to request token: %v", err)
		result <- []*database.Task{}
		return
	}
	tokenString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read token response: %v", err)
		result <- []*database.Task{}
		return
	}
	if resp.StatusCode != 200 {
		log.Printf("JIRA authorization failed: %s", tokenString)
		result <- []*database.Task{}
		return
	}
	var newToken JIRAAuthToken
	err = json.Unmarshal(tokenString, &newToken)
	if err != nil {
		log.Printf("Failed to parse new JIRA token: %v", err)
		result <- []*database.Task{}
		return
	}

	cloudIDURL := "https://api.atlassian.com/oauth/token/accessible-resources"
	if api.JIRAConfigValues.CloudIDURL != nil {
		cloudIDURL = *api.JIRAConfigValues.CloudIDURL
	}
	req, err = http.NewRequest("GET", cloudIDURL, nil)
	if err != nil {
		log.Printf("Error forming cloud ID request: %v", err)
		result <- []*database.Task{}
		return
	}
	req.Header.Add("Authorization", "Bearer "+newToken.AccessToken)
	req.Header.Add("Content-Type", "application/json")
	resp, err = http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to load cloud ID: %v", err)
		result <- []*database.Task{}
		return
	}
	cloudIDData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read cloudID response: %v", err)
		result <- []*database.Task{}
		return
	}
	if resp.StatusCode != 200 {
		log.Printf("CloudID request failed: %s", cloudIDData)
		result <- []*database.Task{}
		return
	}
	JIRASites := []JIRASite{}
	err = json.Unmarshal(cloudIDData, &JIRASites)
	if err != nil {
		log.Printf("Failed to parse cloud ID response: %v", err)
		result <- []*database.Task{}
		return
	}

	if len(JIRASites) == 0 {
		log.Println("No accessible JIRA resources found")
		result <- []*database.Task{}
		return
	}
	cloudID := JIRASites[0].ID
	apiBaseURL := "https://api.atlassian.com/ex/jira/" + cloudID
	if api.JIRAConfigValues.APIBaseURL != nil {
		apiBaseURL = *api.JIRAConfigValues.APIBaseURL
	}
	JQL := "assignee=currentuser() AND status != Done"
	req, err = http.NewRequest("GET", apiBaseURL+"/rest/api/2/search?jql="+url.QueryEscape(JQL), nil)
	if err != nil {
		log.Printf("Error forming search request: %v", err)
		result <- []*database.Task{}
		return
	}
	req.Header.Add("Authorization", "Bearer "+newToken.AccessToken)
	req.Header.Add("Content-Type", "application/json")
	resp, err = http.DefaultClient.Do(req)
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

	var tasks []*database.Task
	for _, jiraTask := range jiraTasks.Issues {
		task := &database.Task{
			TaskBase: database.TaskBase{
				UserID: userID,
				IDExternal: jiraTask.ID,
				Deeplink:   JIRASites[0].URL + "/browse/" + jiraTask.Key,
				Source:     database.TaskSourceJIRA.Name,
				Title:      jiraTask.Fields.Summary,
				Logo:       database.TaskSourceJIRA.Logo,
				TimeAllocation: time.Hour.Nanoseconds(),
			},
		}
		dueDate, err := time.Parse("2006-01-02", jiraTask.Fields.DueDate)
		if err == nil {
			task.DueDate = primitive.NewDateTimeFromTime(dueDate)
		}
		taskCollection.UpdateOne(
			nil,
			bson.M{
				"$and": []bson.M{
					{"id_external": task.IDExternal},
					{"source": task.Source},
				},
			},
			bson.D{{"$set", task}},
			options.Update().SetUpsert(true),
		)
		// This is needed to get the ID of the task; should be removed later once we load all tasks from the db
		var taskIDContainer database.TaskBase
		err = taskCollection.FindOne(
			nil,
			bson.M{
				"$and": []bson.M{
					{"id_external": task.IDExternal},
					{"source": task.Source},
				},
			},
		).Decode(&taskIDContainer)
		if err == nil {
			task.ID = taskIDContainer.ID
		} else {
			log.Printf("Failed to fetch email: %v", err)
		}
		tasks = append(tasks, task)
	}
	result <- tasks
}
