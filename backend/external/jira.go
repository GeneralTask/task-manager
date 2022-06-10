package external

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"net/url"
	"reflect"
	"time"

	"github.com/rs/zerolog/log"

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

func (jira JIRASource) GetListOfPriorities(userID primitive.ObjectID, authToken string) error {
	parentCtx := context.Background()
	var baseURL string
	if jira.Atlassian.Config.ConfigValues.PriorityListURL != nil {
		baseURL = *jira.Atlassian.Config.ConfigValues.PriorityListURL
	} else if siteConfiguration, _ := jira.Atlassian.getSiteConfiguration(userID); siteConfiguration != nil {
		baseURL = jira.getAPIBaseURL(*siteConfiguration)
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

func (jira JIRASource) getAPIBaseURL(siteConfiguration database.AtlassianSiteConfiguration) string {
	return "https://api.atlassian.com/ex/jira/" + siteConfiguration.CloudID
}

func (jira JIRASource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult, fullRefresh bool) {
	result <- emptyEmailResult(nil)
}

func (jira JIRASource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (jira JIRASource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	authToken, _ := jira.Atlassian.getToken(userID, accountID)
	siteConfiguration, _ := jira.Atlassian.getSiteConfiguration(userID)

	if authToken == nil || siteConfiguration == nil {
		result <- emptyTaskResultWithSource(errors.New("missing authToken or siteConfiguration"), TASK_SOURCE_ID_JIRA)
		return
	}

	apiBaseURL := jira.getAPIBaseURL(*siteConfiguration)
	if jira.Atlassian.Config.ConfigValues.APIBaseURL != nil {
		apiBaseURL = *jira.Atlassian.Config.ConfigValues.APIBaseURL
	}
	JQL := "assignee=currentuser() AND status != Done"
	req, err := http.NewRequest("GET", apiBaseURL+"/rest/api/2/search?jql="+url.QueryEscape(JQL), nil)
	if err != nil {
		log.Error().Err(err).Msg("error forming search request")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
		return
	}
	req.Header.Add("Authorization", "Bearer "+authToken.AccessToken)
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Error().Err(err).Msg("failed to load search results")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
		return
	}
	taskData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Error().Err(err).Msg("failed to read search response")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
		return
	}
	if resp.StatusCode != http.StatusOK {
		log.Error().Msgf("search failed: %s %v", taskData, resp.StatusCode)
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
		return
	}

	var jiraTasks JIRATaskList
	err = json.Unmarshal(taskData, &jiraTasks)
	if err != nil {
		log.Error().Err(err).Msg("failed to parse JIRA tasks")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
		return
	}
	defer dbCleanup()

	var tasks []*database.Item
	for _, jiraTask := range jiraTasks.Issues {
		bodyString, err := templating.FormatPlainTextAsHTML(jiraTask.Fields.Description)
		if err != nil {
			log.Error().Err(err).Msg("unable to parse JIRA template")
			result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
			return
		}

		task := &database.Item{
			TaskBase: database.TaskBase{
				UserID:          userID,
				IDExternal:      jiraTask.ID,
				IDTaskSection:   constants.IDTaskSectionDefault,
				Deeplink:        siteConfiguration.SiteURL + "/browse/" + jiraTask.Key,
				SourceID:        TASK_SOURCE_ID_JIRA,
				Title:           jiraTask.Fields.Summary,
				Body:            bodyString,
				SourceAccountID: accountID,
			},
			Task: database.Task{
				PriorityID: jiraTask.Fields.Priority.ID,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		}

		dueDate, err := time.Parse("2006-01-02", jiraTask.Fields.DueDate)
		if err == nil {
			task.DueDate = primitive.NewDateTimeFromTime(dueDate)
		}
		tasks = append(tasks, task)
	}

	cachedMapping := jira.fetchLocalPriorityMapping(database.GetJiraPrioritiesCollection(db), userID)

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
		err = jira.GetListOfPriorities(userID, authToken.AccessToken)
		if err != nil {
			log.Error().Err(err).Msg("failed to fetch priorities")
			result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
			return
		}
		cachedMapping = jira.fetchLocalPriorityMapping(database.GetJiraPrioritiesCollection(db), userID)
	}
	priorityLength := len(*cachedMapping)

	isCompleted := false
	for _, task := range tasks {
		priorityNormalized := float64((*cachedMapping)[task.PriorityID]) / float64(priorityLength)
		dbTask, err := database.UpdateOrCreateTask(
			db,
			userID,
			task.IDExternal,
			task.SourceID,
			task,
			database.TaskItemChangeableFields{
				Title:   &task.Title,
				DueDate: task.DueDate,
				Task: database.TaskChangeable{
					PriorityID:         &task.PriorityID,
					PriorityNormalized: &priorityNormalized,
				},
				IsCompleted: &isCompleted,
			},
			nil,
			false,
		)
		if err != nil {
			result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
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

func (JIRA JIRASource) GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil)
}

func (JIRA JIRASource) fetchLocalPriorityMapping(prioritiesCollection *mongo.Collection, userID primitive.ObjectID) *map[string]int {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := prioritiesCollection.Find(dbCtx, bson.M{"user_id": userID})
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch local priorities")
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

func (jira JIRASource) getFinalTransitionID(apiBaseURL string, AtlassianAuthToken string, jiraCloudID string) *string {
	transitionsURL := apiBaseURL + "/rest/api/3/issue/" + jiraCloudID + "/transitions"

	req, _ := http.NewRequest("GET", transitionsURL, nil)
	req.Header.Add("Authorization", "Bearer "+AtlassianAuthToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Error().Err(err).Msg("failed to request transitions")
		return nil
	}

	responseString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Error().Err(err).Msg("failed to read http response body")
		return nil
	}

	var data map[string]interface{}
	err = json.Unmarshal(responseString, &data)
	if err != nil {
		log.Error().Err(err).Msg("failed to parse json data")
		return nil
	}

	typeOfArray := reflect.TypeOf(data["transitions"]).String()
	log.Info().Str("typeOfArray", typeOfArray).Send()
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

func (jira JIRASource) executeTransition(apiBaseURL string, AtlassianAuthToken string, issueID string, newTransitionID string) error {
	transitionsURL := apiBaseURL + "/rest/api/3/issue/" + issueID + "/transitions"
	params := []byte(`{"transition": {"id": "` + newTransitionID + `"}}`)
	req, _ := http.NewRequest("POST", transitionsURL, bytes.NewBuffer(params))
	req.Header.Add("Authorization", "Bearer "+AtlassianAuthToken)
	req.Header.Add("Content-Type", "application/json")

	_, err := http.DefaultClient.Do(req)
	return err
}

func (jira JIRASource) Reply(userID primitive.ObjectID, accountID string, messageID primitive.ObjectID, emailContents EmailContents) error {
	return errors.New("cannot reply to a JIRA task")
}

func (jira JIRASource) SendEmail(userID primitive.ObjectID, accountID string, email EmailContents) error {
	return errors.New("cannot send email for JIRA source")
}

func (jira JIRASource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	return primitive.NilObjectID, errors.New("has not been implemented yet")
}

func (jira JIRASource) CreateNewEvent(userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (jira JIRASource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskItemChangeableFields, task *database.Item) error {
	if updateFields.IsCompleted != nil && *updateFields.IsCompleted {
		token, _ := jira.Atlassian.getToken(userID, accountID)
		siteConfiguration, _ := jira.Atlassian.getSiteConfiguration(userID)
		if token == nil || siteConfiguration == nil {
			return errors.New("missing token or siteConfiguration")
		}

		//first get the list of transitions
		var apiBaseURL string

		if jira.Atlassian.Config.ConfigValues.TransitionURL != nil {
			apiBaseURL = *jira.Atlassian.Config.ConfigValues.TransitionURL
		} else {
			apiBaseURL = jira.getAPIBaseURL(*siteConfiguration)
		}

		finalTransitionID := jira.getFinalTransitionID(apiBaseURL, token.AccessToken, issueID)

		if finalTransitionID == nil {
			return errors.New("final transition not found")
		}

		return jira.executeTransition(apiBaseURL, token.AccessToken, issueID, *finalTransitionID)
	}
	return nil
}

func (jira JIRASource) ModifyMessage(userID primitive.ObjectID, accountID string, emailID string, updateFields *database.MessageChangeable) error {
	return nil
}

func (jira JIRASource) ModifyThread(userID primitive.ObjectID, accountID string, threadID primitive.ObjectID, isUnread *bool, IsArchived *bool) error {
	return nil
}
