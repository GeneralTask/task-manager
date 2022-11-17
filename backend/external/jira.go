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
	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/GeneralTask/task-manager/backend/templating"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type JIRASource struct {
	Atlassian AtlassianService
}

type JIRAStatus struct {
	ID       string         `json:"id"`
	Name     string         `json:"name"`
	IconURL  string         `json:"iconUrl"`
	Scope    JIRAScope      `json:"scope"`
	Category StatusCategory `json:"statusCategory"`
}

type StatusCategory struct {
	Key string `json:"key"`
}

type JIRAPriority struct {
	ID string `json:"id"`
}

type JIRAScope struct {
	Project JIRAProject `json:"project"`
}

type JIRAProject struct {
	ID string `json:"id"`
}

// JIRATaskFields ...
type JIRATaskFields struct {
	DueDate     string       `json:"duedate"`
	Summary     string       `json:"summary"`
	Description string       `json:"description"`
	CreatedAt   string       `json:"created"`
	UpdatedAt   string       `json:"updated"`
	Project     JIRAProject  `json:"project"`
	Status      JIRAStatus   `json:"status"`
	Priority    JIRAPriority `json:"priority"`
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

func (jira JIRASource) getAPIBaseURL(siteConfiguration database.AtlassianSiteConfiguration) string {
	return "https://api.atlassian.com/ex/jira/" + siteConfiguration.CloudID
}

func (jira JIRASource) GetEvents(db *mongo.Database, userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(errors.New("github PR cannot fetch events"))
}

func (jira JIRASource) GetTasks(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
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
	JQL := "assignee=currentuser() AND statusCategory != Done"
	req, err := http.NewRequest("GET", apiBaseURL+"/rest/api/2/search?jql="+url.QueryEscape(JQL), nil)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("error forming search request")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
		return
	}
	req.Header.Add("Authorization", "Bearer "+authToken.AccessToken)
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		logger.Error().Err(err).Msg("failed to load search results")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
		return
	}
	taskData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		logger.Error().Err(err).Msg("failed to read search response")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
		return
	}
	if resp.StatusCode != http.StatusOK {
		logger.Error().Msgf("search failed: %s %v", taskData, resp.StatusCode)
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
		return
	}

	var jiraTasks JIRATaskList
	err = json.Unmarshal(taskData, &jiraTasks)
	if err != nil {
		logger.Error().Err(err).Msg("failed to parse JIRA tasks")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
		return
	}

	statusMap, err := jira.GetListOfStatuses(userID, authToken.AccessToken)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch statuses")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
		return
	}
	defer dbCleanup()

	var tasks []*database.Task
	for _, jiraTask := range jiraTasks.Issues {
		bodyString, err := templating.FormatPlainTextAsHTML(jiraTask.Fields.Description)
		if err != nil {
			logger.Error().Err(err).Msg("unable to parse JIRA template")
			result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
			return
		}

		task := &database.Task{
			UserID:          userID,
			IDExternal:      jiraTask.ID,
			IDTaskSection:   constants.IDTaskSectionDefault,
			Deeplink:        siteConfiguration.SiteURL + "/browse/" + jiraTask.Key,
			SourceID:        TASK_SOURCE_ID_JIRA,
			Title:           &jiraTask.Fields.Summary,
			Body:            &bodyString,
			SourceAccountID: accountID,
			PriorityID:      &jiraTask.Fields.Priority.ID,
			Status: &database.ExternalTaskStatus{
				ExternalID:        jiraTask.Fields.Status.ID,
				IconURL:           jiraTask.Fields.Status.IconURL,
				State:             jiraTask.Fields.Status.Name,
				IsCompletedStatus: jiraTask.Fields.Status.Category.Key == "done",
			},
		}

		dueDate, err := time.Parse("2006-01-02", jiraTask.Fields.DueDate)
		if err == nil {
			primDueDate := primitive.NewDateTimeFromTime(dueDate)
			task.DueDate = &primDueDate
		}
		createdAt, err := time.Parse("2006-01-02T15:04:05.999-0700", jiraTask.Fields.CreatedAt)
		if err == nil {
			primCreatedAt := primitive.NewDateTimeFromTime(createdAt)
			task.CreatedAtExternal = primCreatedAt
		}
		updatedAt, err := time.Parse("2006-01-02T15:04:05.999-0700", jiraTask.Fields.UpdatedAt)
		if err == nil {
			primUpdatedAt := primitive.NewDateTimeFromTime(updatedAt)
			task.UpdatedAt = primUpdatedAt
		}
		allStatuses, exists := statusMap[jiraTask.Fields.Project.ID]
		if exists {
			task.AllStatuses = allStatuses
		}

		tasks = append(tasks, task)
	}

	cachedMapping := jira.fetchLocalPriorityMapping(database.GetJiraPrioritiesCollection(db), userID)

	//If a priority exists that isn't cached refresh the whole list.
	var needsRefresh bool
	for _, t := range tasks {
		if t.PriorityID != nil && len(*t.PriorityID) == 0 {
			continue
		}
		if t.PriorityID != nil {
			if _, exists := (*cachedMapping)[*t.PriorityID]; !exists {
				needsRefresh = true
				break
			}
		}
	}

	if needsRefresh {
		err = jira.GetListOfPriorities(userID, authToken.AccessToken)
		if err != nil {
			logger.Error().Err(err).Msg("failed to fetch priorities")
			result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_JIRA)
			return
		}
		cachedMapping = jira.fetchLocalPriorityMapping(database.GetJiraPrioritiesCollection(db), userID)
	}

	// TODO remove this comment when fix the priority test logic
	// priorityLength := len(*cachedMapping)

	isCompleted := false
	for _, task := range tasks {
		updateTask := database.Task{
			Title:       task.Title,
			DueDate:     task.DueDate,
			PriorityID:  task.PriorityID,
			Status:      task.Status,
			UpdatedAt:   task.UpdatedAt,
			AllStatuses: task.AllStatuses,
			IsCompleted: &isCompleted,
		}

		// TODO get the below logic to play nicely with tests
		// if task.PriorityID != nil {
		// priority := float64((*cachedMapping)[*task.PriorityID]) / float64(priorityLength)
		// updateTask.PriorityNormalized = &priority
		// }

		dbTask, err := database.UpdateOrCreateTask(
			db,
			userID,
			task.IDExternal,
			task.SourceID,
			task,
			updateTask,
			nil,
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

func (JIRA JIRASource) GetPullRequests(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil, false)
}

func (jira JIRASource) GetListOfStatuses(userID primitive.ObjectID, authToken string) (map[string][]*database.ExternalTaskStatus, error) {
	statusMap := make(map[string][]*database.ExternalTaskStatus)
	var baseURL string
	if jira.Atlassian.Config.ConfigValues.StatusListURL != nil {
		baseURL = *jira.Atlassian.Config.ConfigValues.StatusListURL
	} else if siteConfiguration, _ := jira.Atlassian.getSiteConfiguration(userID); siteConfiguration != nil {
		baseURL = jira.getAPIBaseURL(*siteConfiguration)
	} else {
		return statusMap, errors.New("could not form base url")
	}

	url := baseURL + "/rest/api/3/status/"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", "Bearer "+authToken)
	req.Header.Add("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return statusMap, err
	}
	statusListString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return statusMap, err
	}

	var statuses []JIRAStatus
	err = json.Unmarshal(statusListString, &statuses)
	if err != nil {
		return statusMap, err
	}

	for _, status := range statuses {
		value, exists := statusMap[status.Scope.Project.ID]
		newStatus := database.ExternalTaskStatus{
			ExternalID:        status.ID,
			IconURL:           status.IconURL,
			State:             status.Name,
			IsCompletedStatus: status.Category.Key == "done",
		}

		if exists {
			statusMap[status.Scope.Project.ID] = append(value, &newStatus)
		} else {
			statusMap[status.Scope.Project.ID] = []*database.ExternalTaskStatus{
				&newStatus,
			}
		}
	}
	return statusMap, nil
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

	var priorityIds []JIRAPriority
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

func (JIRA JIRASource) fetchLocalPriorityMapping(prioritiesCollection *mongo.Collection, userID primitive.ObjectID) *map[string]int {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := prioritiesCollection.Find(dbCtx, bson.M{"user_id": userID})
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch local priorities")
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
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to request transitions")
		return nil
	}

	responseString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		logger.Error().Err(err).Msg("failed to read http response body")
		return nil
	}

	var data map[string]interface{}
	err = json.Unmarshal(responseString, &data)
	if err != nil {
		logger.Error().Err(err).Msg("failed to parse json data")
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

func (jira JIRASource) CreateNewTask(db *mongo.Database, userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	return primitive.NilObjectID, errors.New("has not been implemented yet")
}

func (jira JIRASource) CreateNewEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (jira JIRASource) DeleteEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, externalID string) error {
	return errors.New("has not been implemented yet")
}

func (jira JIRASource) ModifyTask(db *mongo.Database, userID primitive.ObjectID, accountID string, issueID string, updateFields *database.Task, task *database.Task) error {
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

func (jira JIRASource) ModifyEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, eventID string, updateFields *EventModifyObject) error {
	return errors.New("has not been implemented yet")
}

func (jira JIRASource) AddComment(db *mongo.Database, userID primitive.ObjectID, accountID string, comment database.Comment, task *database.Task) error {
	return errors.New("has not been implemented yet")
}
