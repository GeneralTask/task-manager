package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"reflect"
	"time"

	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/templating"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// JIRARedirectParams ...
type JIRARedirectParams struct {
	Code  string `form:"code"`
	State string `form:"state"`
}

// JIRATask represents the API detail result for issues - only fields we need
type JIRATask struct {
	Fields JIRATaskFields `json:"fields"`
	ID     string         `json:"id"`
	Key    string         `json:"key"`
}

// JIRATaskFields ...
type JIRATaskFields struct {
	DueDate     string     `json:"duedate"`
	Summary     string     `json:"summary"`
	Description string     `json:"description"`
	Priority    PriorityID `json:"priority"`
}

// JIRATaskList represents the API list result for issues - only fields we need
type JIRATaskList struct {
	Issues []JIRATask `json:"issues"`
}

type PriorityID struct {
	ID string `json:"id"`
}

type TaskResult struct {
	Tasks           []*database.Task
	PriorityMapping *map[string]int
	Error           error
}

func (api *API) AuthorizeJIRA(c *gin.Context) {
	internalToken, err := getTokenFromCookie(c)
	if err != nil {
		return
	}
	atlassian := external.AtlassianService{Config: api.AtlassianConfigValues}
	authURL, err := atlassian.GetLinkAuthURL(internalToken.UserID)
	if err != nil {
		Handle500(c)
		return
	}
	c.Redirect(302, *authURL)
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
		c.JSON(400, gin.H{"detail": "invalid state token format"})
		return
	}
	atlassian := external.AtlassianService{Config: api.AtlassianConfigValues}
	err = atlassian.HandleAuthCallback(redirectParams.Code, stateTokenID, internalToken.UserID)
	if err != nil {
		c.JSON(500, gin.H{"detail": err.Error()})
		return
	}

	c.Redirect(302, config.GetConfigValue("HOME_URL"))
}

func LoadJIRATasks(api *API, userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	authToken, _ := getJIRAToken(api, userID, accountID)
	JIRA := external.JIRASource{Atlassian: external.AtlassianService{Config: api.AtlassianConfigValues}}
	siteConfiguration, _ := JIRA.Atlassian.GetSiteConfiguration(userID)

	if authToken == nil || siteConfiguration == nil {
		result <- emptyTaskResult(errors.New("missing authToken or siteConfiguration"))
		return
	}

	apiBaseURL := JIRA.GetAPIBaseURL(*siteConfiguration)
	if api.AtlassianConfigValues.APIBaseURL != nil {
		apiBaseURL = *api.AtlassianConfigValues.APIBaseURL
	}
	JQL := "assignee=currentuser() AND status != Done"
	req, err := http.NewRequest("GET", apiBaseURL+"/rest/api/2/search?jql="+url.QueryEscape(JQL), nil)
	if err != nil {
		log.Printf("error forming search request: %v", err)
		result <- emptyTaskResult(err)
		return
	}
	req.Header.Add("Authorization", "Bearer "+authToken.AccessToken)
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("failed to load search results: %v", err)
		result <- emptyTaskResult(err)
		return
	}
	taskData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("failed to read search response: %v", err)
		result <- emptyTaskResult(err)
		return
	}
	if resp.StatusCode != 200 {
		log.Printf("search failed: %s %v", taskData, resp.StatusCode)
		result <- emptyTaskResult(err)
		return
	}

	var jiraTasks JIRATaskList
	err = json.Unmarshal(taskData, &jiraTasks)
	if err != nil {
		log.Printf("failed to parse JIRA tasks: %v", err)
		result <- emptyTaskResult(err)
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyTaskResult(err)
		return
	}
	defer dbCleanup()

	var tasks []*database.Task
	for _, jiraTask := range jiraTasks.Issues {
		bodyString, err := templating.FormatPlainTextAsHTML(jiraTask.Fields.Description)
		if err != nil {
			log.Printf("unable to parse JIRA template: %v", err)
			result <- emptyTaskResult(err)
			return
		}

		task := &database.Task{
			TaskBase: database.TaskBase{
				UserID:          userID,
				IDExternal:      jiraTask.ID,
				IDTaskSection:   IDTaskSectionToday,
				Deeplink:        siteConfiguration.SiteURL + "/browse/" + jiraTask.Key,
				Source:          database.TaskSourceJIRA,
				Title:           jiraTask.Fields.Summary,
				Body:            bodyString,
				TimeAllocation:  time.Hour.Nanoseconds(),
				SourceAccountID: accountID,
			},
			PriorityID: jiraTask.Fields.Priority.ID,
		}
		dueDate, err := time.Parse("2006-01-02", jiraTask.Fields.DueDate)
		if err == nil {
			task.DueDate = primitive.NewDateTimeFromTime(dueDate)
		}
		var dbTask database.Task
		res, err := database.UpdateOrCreateTask(
			db,
			userID,
			task.IDExternal,
			task.Source,
			task,
			database.TaskChangeableFields{
				Title:      task.Title,
				DueDate:    task.DueDate,
				PriorityID: task.PriorityID,
			},
		)
		if err != nil {
			result <- emptyTaskResult(err)
			return
		}
		err = res.Decode(&dbTask)
		if err != nil {
			log.Printf("failed to update or create task: %v", err)
			result <- emptyTaskResult(err)
			return
		}
		task.ID = dbTask.ID
		task.IDOrdering = dbTask.IDOrdering
		task.IDTaskSection = dbTask.IDTaskSection
		if dbTask.PriorityID != task.PriorityID && !dbTask.HasBeenReordered {
			task.IDOrdering = 0
		}
		tasks = append(tasks, task)
	}

	cachedMapping := fetchLocalPriorityMapping(db.Collection("jira_priorities"), userID)

	//If a priority exists that isn't cached refresh the whole list.
	var needsRefresh bool
	for _, t := range tasks {
		if len(t.PriorityID) == 0 {
			continue
		}
		if _, exists := (*cachedMapping)[t.PriorityID]; !exists {
			needsRefresh = true
			break
		}
	}

	if needsRefresh {
		err = GetListOfJIRAPriorities(api, userID, authToken.AccessToken)
		if err != nil {
			log.Printf("failed to fetch priorities: %v", err)
			result <- emptyTaskResult(err)
			return
		}
		cachedMapping = fetchLocalPriorityMapping(db.Collection("jira_priorities"), userID)
	}

	result <- TaskResult{
		Tasks:           tasks,
		PriorityMapping: cachedMapping,
	}
}

func emptyTaskResult(err error) TaskResult {
	var priorities map[string]int
	return TaskResult{
		Tasks:           []*database.Task{},
		PriorityMapping: &priorities,
		Error:           err,
	}
}

func getJIRAToken(api *API, userID primitive.ObjectID, accountID string) (*external.AtlassianAuthToken, error) {
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

	var token external.AtlassianAuthToken
	err = json.Unmarshal([]byte(JIRAToken.Token), &token)
	if err != nil {
		log.Printf("failed to parse JIRA token: %v", err)
		return nil, err
	}
	params := []byte(`{"grant_type": "refresh_token","client_id": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + `","client_secret": "` + config.GetConfigValue("JIRA_OAUTH_CLIENT_SECRET") + `","refresh_token": "` + token.RefreshToken + `"}`)
	tokenURL := "https://auth.atlassian.com/oauth/token"
	if api.AtlassianConfigValues.TokenURL != nil {
		tokenURL = *api.AtlassianConfigValues.TokenURL
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
	var newToken external.AtlassianAuthToken
	err = json.Unmarshal(tokenString, &newToken)
	if err != nil {
		log.Printf("failed to parse new JIRA token: %v", err)
		return nil, err
	}
	return &newToken, nil
}

func MarkJIRATaskDone(api *API, userID primitive.ObjectID, accountID string, issueID string) error {
	token, _ := getJIRAToken(api, userID, accountID)
	JIRA := external.JIRASource{Atlassian: external.AtlassianService{Config: api.AtlassianConfigValues}}
	siteConfiguration, _ := JIRA.Atlassian.GetSiteConfiguration(userID)
	if token == nil || siteConfiguration == nil {
		return errors.New("missing token or siteConfiguration")
	}

	//first get the list of transitions
	var apiBaseURL string

	if api.AtlassianConfigValues.TransitionURL != nil {
		apiBaseURL = *api.AtlassianConfigValues.TransitionURL
	} else {
		apiBaseURL = JIRA.GetAPIBaseURL(*siteConfiguration)
	}

	finalTransitionID := getFinalTransitionID(apiBaseURL, token.AccessToken, issueID)

	if finalTransitionID == nil {
		return errors.New("final transition not found")
	}

	return executeTransition(apiBaseURL, token.AccessToken, issueID, *finalTransitionID)
}

func getFinalTransitionID(apiBaseURL string, AtlassianAuthToken string, jiraCloudID string) *string {
	transitionsURL := apiBaseURL + "/rest/api/3/issue/" + jiraCloudID + "/transitions"

	req, _ := http.NewRequest("GET", transitionsURL, nil)
	req.Header.Add("Authorization", "Bearer "+AtlassianAuthToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("failed to request transitions: %v", err)
		return nil
	}

	responseString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("failed to read http response body: %v", err)
		return nil
	}

	var data map[string]interface{}
	err = json.Unmarshal(responseString, &data)
	if err != nil {
		log.Printf("failed to parse json data: %v", err)
		return nil
	}

	typeOfArray := reflect.TypeOf(data["transitions"]).String()
	fmt.Println(typeOfArray)
	transitionsArray, castResult := data["transitions"].([]interface{})
	if !castResult || len(transitionsArray) < 1 {
		return nil
	}
	lastTransition, castResult := transitionsArray[len(transitionsArray)-1].(map[string]interface{})
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

func executeTransition(apiBaseURL string, AtlassianAuthToken string, issueID string, newTransitionID string) error {
	transitionsURL := apiBaseURL + "/rest/api/3/issue/" + issueID + "/transitions"
	params := []byte(`{"transition": {"id": "` + newTransitionID + `"}}`)
	req, _ := http.NewRequest("POST", transitionsURL, bytes.NewBuffer(params))
	req.Header.Add("Authorization", "Bearer "+AtlassianAuthToken)
	req.Header.Add("Content-Type", "application/json")

	_, err := http.DefaultClient.Do(req)
	return err
}

func fetchLocalPriorityMapping(prioritiesCollection *mongo.Collection, userID primitive.ObjectID) *map[string]int {
	cursor, err := prioritiesCollection.Find(context.TODO(), bson.M{"user_id": userID})
	if err != nil {
		log.Printf("failed to fetch local priorities: %v", err)
		return nil
	}
	var priorities []database.JIRAPriority
	err = cursor.All(context.TODO(), &priorities)
	if err != nil {
		return nil
	}

	result := make(map[string]int)
	for _, p := range priorities {
		result[p.JIRAID] = p.IntegerPriority
	}
	return &result
}

func GetListOfJIRAPriorities(api *API, userID primitive.ObjectID, authToken string) error {
	var baseURL string
	JIRA := external.JIRASource{Atlassian: external.AtlassianService{Config: api.AtlassianConfigValues}}
	if api.AtlassianConfigValues.PriorityListURL != nil {
		baseURL = *api.AtlassianConfigValues.PriorityListURL
	} else if siteConfiguration, _ := JIRA.Atlassian.GetSiteConfiguration(userID); siteConfiguration != nil {
		baseURL = JIRA.GetAPIBaseURL(*siteConfiguration)
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
