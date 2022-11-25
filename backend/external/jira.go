package external

import (
	"bytes"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"net/url"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/GeneralTask/task-manager/backend/templating"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const (
	JIRADone = "done"
)

type JIRASource struct {
	Atlassian AtlassianService
}

type JIRATransition struct {
	ID       string     `json:"id"`
	ToStatus JIRAStatus `json:"to"`
}

type JIRATransitionList struct {
	Transitions []JIRATransition `json:"transitions"`
}

type JIRAStatus struct {
	ID       string             `json:"id"`
	Name     string             `json:"name"`
	IconURL  string             `json:"iconUrl"`
	Scope    JIRAScope          `json:"scope"`
	Category JIRAStatusCategory `json:"statusCategory"`
}

type JIRAStatusCategory struct {
	Key string `json:"key"`
}

type JIRAPriority struct {
	ID      string `json:"id,omitempty"`
	Color   string `json:"statusColor,omitempty"`
	Name    string `json:"name,omitempty"`
	IconURL string `json:"iconURL,omitempty"`
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
	authToken, _ := jira.Atlassian.getAndRefreshToken(userID, accountID)
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

	req = addJIRARequestHeaders(req, authToken.AccessToken)
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

	priorityList, err := jira.GetListOfPriorities(userID, authToken.AccessToken)
	if err != nil {
		// still want to continue if cannot fetch priorities, as it is not a required field
		logger.Error().Err(err).Msg("failed to fetch priorities")
	}

	var tasks []*database.Task
	for _, jiraTask := range jiraTasks.Issues {
		titleString := jiraTask.Fields.Summary
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
			Title:           &titleString,
			Body:            &bodyString,
			SourceAccountID: accountID,
			Status: &database.ExternalTaskStatus{
				ExternalID:        jiraTask.Fields.Status.ID,
				IconURL:           jiraTask.Fields.Status.IconURL,
				State:             jiraTask.Fields.Status.Name,
				IsCompletedStatus: jiraTask.Fields.Status.Category.Key == JIRADone,
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
		if jiraTask.Fields.Priority.ID != "" && len(priorityList) > 0 {
			priorityLength := len(priorityList)

			var allPriorities []*database.ExternalTaskPriority
			for idx, priority := range priorityList {
				priorityNormalized := getNormalizedPriority(idx, priorityLength)
				priorityObject := database.ExternalTaskPriority{
					ExternalID:         priority.ID,
					Name:               priority.Name,
					IconURL:            priority.IconURL,
					Color:              priority.Color,
					PriorityNormalized: priorityNormalized,
				}
				if priority.ID == jiraTask.Fields.Priority.ID {
					task.ExternalPriority = &priorityObject
					task.PriorityNormalized = &priorityNormalized
				}
				allPriorities = append(allPriorities, &priorityObject)
			}

			task.AllExternalPriorities = allPriorities
		}

		tasks = append(tasks, task)
	}

	isCompleted := false
	for _, task := range tasks {
		updateTask := database.Task{
			Title:                 task.Title,
			DueDate:               task.DueDate,
			Status:                task.Status,
			UpdatedAt:             task.UpdatedAt,
			PriorityNormalized:    task.PriorityNormalized,
			ExternalPriority:      task.ExternalPriority,
			AllExternalPriorities: task.AllExternalPriorities,
			AllStatuses:           task.AllStatuses,
			IsCompleted:           &isCompleted,
		}

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
	}

	result <- TaskResult{
		Tasks: tasks,
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
	req = addJIRARequestHeaders(req, authToken)

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
			IsCompletedStatus: status.Category.Key == JIRADone,
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

func (jira JIRASource) GetListOfPriorities(userID primitive.ObjectID, authToken string) ([]JIRAPriority, error) {
	var priorityIds []JIRAPriority
	var baseURL string
	if jira.Atlassian.Config.ConfigValues.PriorityListURL != nil {
		baseURL = *jira.Atlassian.Config.ConfigValues.PriorityListURL
	} else if siteConfiguration, _ := jira.Atlassian.getSiteConfiguration(userID); siteConfiguration != nil {
		baseURL = jira.getAPIBaseURL(*siteConfiguration)
	} else {
		return priorityIds, errors.New("could not form base url")
	}

	url := baseURL + "/rest/api/3/priority/"
	req, _ := http.NewRequest("GET", url, nil)
	req = addJIRARequestHeaders(req, authToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return priorityIds, err
	}

	priorityListString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return priorityIds, err
	}

	err = json.Unmarshal(priorityListString, &priorityIds)
	if err != nil {
		return priorityIds, err
	}
	return priorityIds, nil
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
	token, _ := jira.Atlassian.getAndRefreshToken(userID, accountID)
	siteConfiguration, _ := jira.Atlassian.getSiteConfiguration(userID)
	if token == nil || siteConfiguration == nil {
		return errors.New("missing token or siteConfiguration")
	}

	if updateFields.IsDeleted != nil {
		return jira.handleJIRAIssueDelete(siteConfiguration, token, issueID, updateFields)
	}

	if updateFields.Status != nil {
		err := jira.handleJIRATransitionUpdate(siteConfiguration, token, issueID, updateFields)
		if err != nil {
			return err
		}
	}

	if updateFields.Title != nil || updateFields.Body != nil || updateFields.ExternalPriority != nil {
		err := jira.handleJIRAFieldUpdate(siteConfiguration, token, issueID, updateFields)
		if err != nil {
			return err
		}
	}

	return nil
}

func (jira JIRASource) handleJIRAIssueDelete(siteConfiguration *database.AtlassianSiteConfiguration, token *AtlassianAuthToken, issueID string, updateFields *database.Task) error {
	var apiBaseURL string
	if jira.Atlassian.Config.ConfigValues.IssueDeleteURL != nil {
		apiBaseURL = *jira.Atlassian.Config.ConfigValues.IssueDeleteURL
	} else {
		apiBaseURL = jira.getAPIBaseURL(*siteConfiguration)
	}

	if *updateFields.IsDeleted {
		deleteURL := apiBaseURL + "/rest/api/3/issue/" + issueID
		req, _ := http.NewRequest("DELETE", deleteURL, nil)
		req = addJIRARequestHeaders(req, token.AccessToken)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return err
		}
		if resp.StatusCode != 200 && resp.StatusCode != 204 {
			return errors.New("unable to successfully delete JIRA task")
		}
	} else {
		// once JIRA tickets are deleted, they cannot be brought back
		return errors.New("cannot undelete JIRA tasks")
	}
	return nil
}

func (jira JIRASource) handleJIRATransitionUpdate(siteConfiguration *database.AtlassianSiteConfiguration, token *AtlassianAuthToken, issueID string, updateFields *database.Task) error {
	var apiBaseURL string
	if jira.Atlassian.Config.ConfigValues.TransitionURL != nil {
		apiBaseURL = *jira.Atlassian.Config.ConfigValues.TransitionURL
	} else {
		apiBaseURL = jira.getAPIBaseURL(*siteConfiguration)
	}

	finalTransitionID := jira.getTransitionID(apiBaseURL, token.AccessToken, issueID, *updateFields.Status)
	if finalTransitionID == nil {
		return errors.New("transition not found")
	}

	return jira.executeTransition(apiBaseURL, token.AccessToken, issueID, *finalTransitionID)
}

type JIRAUpdateRequest struct {
	Fields JIRAUpdateFields `json:"fields"`
}

type JIRAUpdateFields struct {
	Summary     string                `json:"summary,omitempty"`
	Description *JIRADescriptionField `json:"description,omitempty"`
	Priority    *JIRAPriority         `json:"priority,omitempty"`
}

type JIRADescriptionField struct {
	Type    string             `json:"type,omitempty"`
	Version int                `json:"version,omitempty"`
	Content []JIRAFieldContent `json:"content"`
}

type JIRAFieldContent struct {
	Type    string             `json:"type"`
	Content []JIRAFieldContent `json:"content,omitempty"`
	Text    string             `json:"text,omitempty"`
}

func (jira JIRASource) handleJIRAFieldUpdate(siteConfiguration *database.AtlassianSiteConfiguration, token *AtlassianAuthToken, issueID string, updateFields *database.Task) error {
	var apiBaseURL string
	if jira.Atlassian.Config.ConfigValues.IssueUpdateURL != nil {
		apiBaseURL = *jira.Atlassian.Config.ConfigValues.IssueUpdateURL
	} else {
		apiBaseURL = jira.getAPIBaseURL(*siteConfiguration)
	}

	var updateRequest JIRAUpdateRequest
	if updateFields.Title != nil {
		if *updateFields.Title == "" {
			return errors.New("cannot set JIRA issue title to empty string")
		}

		updateRequest.Fields.Summary = *updateFields.Title
	}
	if updateFields.Body != nil {
		if *updateFields.Body == "" {
			updateRequest.Fields.Description = &JIRADescriptionField{
				Type:    "doc",
				Version: 1,
				Content: []JIRAFieldContent{},
			}
		} else {
			updateRequest.Fields.Description = &JIRADescriptionField{
				Type:    "doc",
				Version: 1,
				Content: []JIRAFieldContent{
					{
						Type: "paragraph",
						Content: []JIRAFieldContent{
							{
								Text: *updateFields.Body,
								Type: "text",
							},
						},
					},
				},
			}
		}
	}
	if (updateFields.ExternalPriority != nil && *updateFields.ExternalPriority != database.ExternalTaskPriority{}) {
		updateRequest.Fields.Priority = &JIRAPriority{
			ID: updateFields.ExternalPriority.ExternalID,
		}
	}

	updateRequestBytes, err := json.Marshal(&updateRequest)
	if err != nil {
		return errors.New("unable to marshal update fields for JIRA request")
	}

	return jira.executeFieldUpdate(apiBaseURL, token.AccessToken, issueID, updateRequestBytes)
}

func (jira JIRASource) getTransitionID(apiBaseURL string, AtlassianAuthToken string, jiraCloudID string, status database.ExternalTaskStatus) *string {
	transitionsURL := apiBaseURL + "/rest/api/3/issue/" + jiraCloudID + "/transitions"

	req, _ := http.NewRequest("GET", transitionsURL, nil)
	req = addJIRARequestHeaders(req, AtlassianAuthToken)

	resp, err := http.DefaultClient.Do(req)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to request transitions")
		return nil
	}

	responseBytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		logger.Error().Err(err).Msg("failed to read http response body")
		return nil
	}

	var transitionList JIRATransitionList
	err = json.Unmarshal(responseBytes, &transitionList)
	if err != nil {
		logger.Error().Err(err).Msg("failed to parse JIRA transition list")
		return nil
	}
	if len(transitionList.Transitions) == 0 {
		logger.Error().Err(err).Msg("no JIRA transitions found in list")
		return nil
	}

	for _, transition := range transitionList.Transitions {
		if transition.ToStatus.ID == status.ExternalID {
			return &transition.ID
		}
	}

	logger.Error().Err(err).Msg("no matching JIRA transitions found")
	return nil
}

func (jira JIRASource) executeTransition(apiBaseURL string, AtlassianAuthToken string, issueID string, newTransitionID string) error {
	transitionsURL := apiBaseURL + "/rest/api/3/issue/" + issueID + "/transitions"
	params := []byte(`{"transition": {"id": "` + newTransitionID + `"}}`)
	req, _ := http.NewRequest("POST", transitionsURL, bytes.NewBuffer(params))
	req = addJIRARequestHeaders(req, AtlassianAuthToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	if resp.StatusCode != 200 && resp.StatusCode != 204 {
		return errors.New("unable to successfully make status transition update request")
	}
	return nil
}

func (jira JIRASource) executeFieldUpdate(apiBaseURL string, AtlassianAuthToken string, issueID string, updateBytes []byte) error {
	transitionsURL := apiBaseURL + "/rest/api/3/issue/" + issueID
	req, _ := http.NewRequest("PUT", transitionsURL, bytes.NewBuffer(updateBytes))
	req = addJIRARequestHeaders(req, AtlassianAuthToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	if resp.StatusCode != 200 && resp.StatusCode != 204 {
		return errors.New("unable to successfully make field update request")
	}
	return nil
}

func (jira JIRASource) ModifyEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, eventID string, updateFields *EventModifyObject) error {
	return errors.New("has not been implemented yet")
}

func (jira JIRASource) AddComment(db *mongo.Database, userID primitive.ObjectID, accountID string, comment database.Comment, task *database.Task) error {
	return errors.New("has not been implemented yet")
}

func addJIRARequestHeaders(req *http.Request, authToken string) *http.Request {
	req.Header.Add("Authorization", "Bearer "+authToken)
	req.Header.Add("Content-Type", "application/json")
	return req
}

func getNormalizedPriority(idx int, length int) float64 {
	priorityNormalized := 1.0
	if length > 1 {
		priorityNormalized = ((float64(idx) / (float64(length) - 1.0)) * 3.0) + 1.0
	}
	return priorityNormalized
}
