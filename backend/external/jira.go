package external

import (
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
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
	var baseURL string
	if JIRA.Atlassian.Config.PriorityListURL != nil {
		baseURL = *JIRA.Atlassian.Config.PriorityListURL
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

func (JIRA JIRASource) GetAPIBaseURL(siteConfiguration database.AtlassianSiteConfiguration) string {
	return "https://api.atlassian.com/ex/jira/" + siteConfiguration.CloudID
}

func (JIRA JIRASource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	authToken, _ := JIRA.Atlassian.GetToken(userID, accountID)
	siteConfiguration, _ := JIRA.Atlassian.GetSiteConfiguration(userID)

	if authToken == nil || siteConfiguration == nil {
		result <- emptyTaskResult(errors.New("missing authToken or siteConfiguration"))
		return
	}

	apiBaseURL := JIRA.GetAPIBaseURL(*siteConfiguration)
	if JIRA.Atlassian.Config.APIBaseURL != nil {
		apiBaseURL = *JIRA.Atlassian.Config.APIBaseURL
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
				IDTaskSection:   constants.IDTaskSectionToday,
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

	cachedMapping := JIRA.fetchLocalPriorityMapping(db.Collection("jira_priorities"), userID)

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
		cachedMapping = JIRA.fetchLocalPriorityMapping(db.Collection("jira_priorities"), userID)
	}

	result <- TaskResult{
		Tasks:           tasks,
		PriorityMapping: cachedMapping,
	}
}

func (JIRA JIRASource) fetchLocalPriorityMapping(prioritiesCollection *mongo.Collection, userID primitive.ObjectID) *map[string]int {
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

func emptyTaskResult(err error) TaskResult {
	var priorities map[string]int
	return TaskResult{
		Tasks:           []*database.Task{},
		PriorityMapping: &priorities,
		Error:           err,
	}
}
