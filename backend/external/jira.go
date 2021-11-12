package external

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

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/settings"
	"github.com/GeneralTask/task-manager/backend/templating"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type JIRASource struct {
	Atlassian AtlassianService
}

// JIRATaskFields ...
type JIRATaskFields struct {
	DueDate     string     `json:"duedate"`
	Summary     string     `json:"summary"`
	Description string     `json:"description"`
	Priority    PriorityID `json:"priority"`
}

// JIRATask represents the API detail result for issues - only fields we need
type JIRATask struct {
	Fields JIRATaskFields `json:"fields"`
	ID     string         `json:"id"`
	Key    string         `json:"key"`
}

// JIRATaskList represents the API list result for issues - only fields we need
type JIRATaskList struct {
	Issues []JIRATask `json:"issues"`
}

func (JIRA JIRASource) GetListOfPriorities(userID primitive.ObjectID, authToken string) error {
	parentCtx := context.Background()
	var baseURL string
	if JIRA.Atlassian.Config.ConfigValues.PriorityListURL != nil {
		baseURL = *JIRA.Atlassian.Config.ConfigValues.PriorityListURL
	} else if siteConfiguration, _ := JIRA.Atlassian.getSiteConfiguration(userID); siteConfiguration != nil {
		baseURL = JIRA.getAPIBaseURL(*siteConfiguration)
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

	prioritiesCollection := database.GetJiraPrioritiesCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = prioritiesCollection.DeleteMany(dbCtx, bson.M{"user_id": userID})
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
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = prioritiesCollection.InsertMany(dbCtx, jiraPriorities)
	return err
}

func (JIRA JIRASource) getAPIBaseURL(siteConfiguration database.AtlassianSiteConfiguration) string {
	return "https://api.atlassian.com/ex/jira/" + siteConfiguration.CloudID
}

func (JIRA JIRASource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult) {
	result <- emptyEmailResult(nil)
}

func (JIRA JIRASource) GetEvents(userID primitive.ObjectID, accountID string, timezoneOffsetMinutes int, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (JIRA JIRASource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	authToken, _ := JIRA.Atlassian.getToken(userID, accountID)
	siteConfiguration, _ := JIRA.Atlassian.getSiteConfiguration(userID)

	if authToken == nil || siteConfiguration == nil {
		result <- emptyTaskResult(errors.New("missing authToken or siteConfiguration"))
		return
	}

	apiBaseURL := JIRA.getAPIBaseURL(*siteConfiguration)
	if JIRA.Atlassian.Config.ConfigValues.APIBaseURL != nil {
		apiBaseURL = *JIRA.Atlassian.Config.ConfigValues.APIBaseURL
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
	if resp.StatusCode != http.StatusOK {
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
				IDTaskSection:   constants.IDTaskSectionToday,
				Deeplink:        siteConfiguration.SiteURL + "/browse/" + jiraTask.Key,
				SourceID:        TASK_SOURCE_ID_JIRA,
				Title:           jiraTask.Fields.Summary,
				Body:            bodyString,
				TimeAllocation:  settings.GetDefaultTaskDuration(db, userID),
				SourceAccountID: accountID,
			},
			PriorityID: jiraTask.Fields.Priority.ID,
		}
		dueDate, err := time.Parse("2006-01-02", jiraTask.Fields.DueDate)
		if err == nil {
			task.DueDate = primitive.NewDateTimeFromTime(dueDate)
		}
		tasks = append(tasks, task)
	}

	cachedMapping := JIRA.fetchLocalPriorityMapping(database.GetJiraPrioritiesCollection(db), userID)

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
		err = JIRA.GetListOfPriorities(userID, authToken.AccessToken)
		if err != nil {
			log.Printf("failed to fetch priorities: %v", err)
			result <- emptyTaskResult(err)
			return
		}
		cachedMapping = JIRA.fetchLocalPriorityMapping(database.GetJiraPrioritiesCollection(db), userID)
	}
	priorityLength := len(*cachedMapping)

	for _, task := range tasks {
		var dbTask database.Task
		res, err := database.UpdateOrCreateTask(
			db,
			userID,
			task.IDExternal,
			task.SourceID,
			task,
			database.TaskChangeableFields{
				Title:              task.Title,
				DueDate:            task.DueDate,
				PriorityID:         task.PriorityID,
				PriorityNormalized: float64((*cachedMapping)[task.PriorityID]) / float64(priorityLength),
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
		task.HasBeenReordered = dbTask.HasBeenReordered
		task.ID = dbTask.ID
		task.IDOrdering = dbTask.IDOrdering
		task.IDTaskSection = dbTask.IDTaskSection
		if dbTask.PriorityID != task.PriorityID && !dbTask.HasBeenReordered {
			task.IDOrdering = 0
		}
	}

	result <- TaskResult{
		Tasks:           tasks,
		PriorityMapping: cachedMapping,
	}
}

func (JIRA JIRASource) fetchLocalPriorityMapping(prioritiesCollection *mongo.Collection, userID primitive.ObjectID) *map[string]int {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := prioritiesCollection.Find(dbCtx, bson.M{"user_id": userID})
	if err != nil {
		log.Printf("failed to fetch local priorities: %v", err)
		return nil
	}
	var priorities []database.JIRAPriority
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &priorities)
	if err != nil {
		return nil
	}

	result := make(map[string]int)
	for _, p := range priorities {
		result[p.JIRAID] = p.IntegerPriority
	}
	return &result
}

func (JIRA JIRASource) MarkAsDone(userID primitive.ObjectID, accountID string, issueID string) error {
	token, _ := JIRA.Atlassian.getToken(userID, accountID)
	siteConfiguration, _ := JIRA.Atlassian.getSiteConfiguration(userID)
	if token == nil || siteConfiguration == nil {
		return errors.New("missing token or siteConfiguration")
	}

	//first get the list of transitions
	var apiBaseURL string

	if JIRA.Atlassian.Config.ConfigValues.TransitionURL != nil {
		apiBaseURL = *JIRA.Atlassian.Config.ConfigValues.TransitionURL
	} else {
		apiBaseURL = JIRA.getAPIBaseURL(*siteConfiguration)
	}

	finalTransitionID := JIRA.getFinalTransitionID(apiBaseURL, token.AccessToken, issueID)

	if finalTransitionID == nil {
		return errors.New("final transition not found")
	}

	return JIRA.executeTransition(apiBaseURL, token.AccessToken, issueID, *finalTransitionID)
}

func (JIRA JIRASource) getFinalTransitionID(apiBaseURL string, AtlassianAuthToken string, jiraCloudID string) *string {
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

func (JIRA JIRASource) executeTransition(apiBaseURL string, AtlassianAuthToken string, issueID string, newTransitionID string) error {
	transitionsURL := apiBaseURL + "/rest/api/3/issue/" + issueID + "/transitions"
	params := []byte(`{"transition": {"id": "` + newTransitionID + `"}}`)
	req, _ := http.NewRequest("POST", transitionsURL, bytes.NewBuffer(params))
	req.Header.Add("Authorization", "Bearer "+AtlassianAuthToken)
	req.Header.Add("Content-Type", "application/json")

	_, err := http.DefaultClient.Do(req)
	return err
}

func (JIRA JIRASource) Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, body string) error {
	return errors.New("cannot reply to a JIRA task")
}

func (JIRA JIRASource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	return errors.New("has not been implemented yet")
}
