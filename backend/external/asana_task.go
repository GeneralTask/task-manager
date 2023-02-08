package external

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AsanaTaskSource struct {
	Asana AsanaService
}

const (
	AsanaUserInfoURL = "https://app.asana.com/api/1.0/users/me"
	AsanaTasksURL    = "https://app.asana.com/api/1.0/tasks/"
)

type AsanaUserInfoResponse struct {
	Data struct {
		Workspaces []struct {
			ID string `json:"gid"`
		} `json:"workspaces"`
	} `json:"data"`
}

type AsanaTasksResponse struct {
	Data []struct {
		GID          string             `json:"gid"`
		DueOn        string             `json:"due_on"`
		HTMLNotes    string             `json:"html_notes"`
		Name         string             `json:"name"`
		PermalinkURL string             `json:"permalink_url"`
		CreatedAt    primitive.DateTime `json:"created_at"`
	} `json:"data"`
}

type AsanaTasksUpdateFields struct {
	Name      *string `json:"name,omitempty"`
	HTMLNotes *string `json:"html_notes,omitempty"`
	DueOn     *string `json:"due_on,omitempty"`
	Completed *bool   `json:"completed,omitempty"`
}

type AsanaTasksUpdateBody struct {
	Data AsanaTasksUpdateFields `json:"data"`
}

func (asanaTask AsanaTaskSource) GetEvents(db *mongo.Database, userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, scopes []string, result chan<- CalendarResult) {
	result <- emptyCalendarResult(errors.New("asana cannot fetch events"))
}

func (asanaTask AsanaTaskSource) GetTasks(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	client := getAsanaHttpClient(db, userID, accountID)

	userInfoURL := AsanaUserInfoURL
	if asanaTask.Asana.ConfigValues.UserInfoURL != nil {
		userInfoURL = *asanaTask.Asana.ConfigValues.UserInfoURL
		client = http.DefaultClient
	}

	var userInfo AsanaUserInfoResponse
	err := getJSON(client, userInfoURL, &userInfo)
	logger := logging.GetSentryLogger()
	if err != nil || len(userInfo.Data.Workspaces) == 0 {
		logger.Error().Err(err).Msg("failed to get asana workspace ID")
		if err == nil {
			err = errors.New("user has not workspaces")
		}
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_ASANA)
		return
	}
	workspaceID := userInfo.Data.Workspaces[0].ID

	taskFetchURL := fmt.Sprintf(AsanaTasksURL+"?assignee=me&workspace=%s&completed_since=3022-01-01&opt_fields=this.html_notes,this.name,this.due_at,this.due_on,this.permalink_url", workspaceID)
	if asanaTask.Asana.ConfigValues.TaskFetchURL != nil {
		taskFetchURL = *asanaTask.Asana.ConfigValues.TaskFetchURL
		client = http.DefaultClient
	} else if client == nil {
		client = getAsanaHttpClient(db, userID, accountID)
	}

	var asanaTasks AsanaTasksResponse
	err = getJSON(client, taskFetchURL, &asanaTasks)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch asana tasks")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_ASANA)
		return
	}

	var tasks []*database.Task
	for _, asanaTaskData := range asanaTasks.Data {
		title := asanaTaskData.Name
		body := asanaTaskData.HTMLNotes
		task := &database.Task{
			UserID:            userID,
			IDExternal:        asanaTaskData.GID,
			IDTaskSection:     constants.IDTaskSectionDefault,
			Deeplink:          asanaTaskData.PermalinkURL,
			SourceID:          TASK_SOURCE_ID_ASANA,
			Title:             &title,
			Body:              &body,
			SourceAccountID:   accountID,
			CreatedAtExternal: asanaTaskData.CreatedAt,
		}
		dueDate, err := time.Parse(constants.YEAR_MONTH_DAY_FORMAT, asanaTaskData.DueOn)
		if err == nil {
			dueDatePrim := primitive.NewDateTimeFromTime(dueDate)
			task.DueDate = &dueDatePrim
		}
		isCompleted := false
		dbTask, err := database.UpdateOrCreateTask(
			db,
			userID,
			task.IDExternal,
			task.SourceID,
			task,
			database.Task{
				Title:       task.Title,
				Body:        task.Body,
				DueDate:     task.DueDate,
				IsCompleted: &isCompleted,
			},
			nil,
		)
		if err != nil {
			result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_ASANA)
			return
		}
		task.HasBeenReordered = dbTask.HasBeenReordered
		task.ID = dbTask.ID
		task.IDOrdering = dbTask.IDOrdering
		task.IDTaskSection = dbTask.IDTaskSection
		task.TimeAllocation = dbTask.TimeAllocation
		tasks = append(tasks, task)
	}

	result <- TaskResult{
		Tasks: tasks,
	}
}

func (asanaTask AsanaTaskSource) GetPullRequests(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil, false)
}

func (asanaTask AsanaTaskSource) ModifyTask(db *mongo.Database, userID primitive.ObjectID, accountID string, issueID string, updateFields *database.Task, task *database.Task) error {
	client := getAsanaHttpClient(db, userID, accountID)

	taskUpdateURL := fmt.Sprintf(AsanaTasksURL+"%s/", issueID)
	if asanaTask.Asana.ConfigValues.TaskUpdateURL != nil {
		taskUpdateURL = *asanaTask.Asana.ConfigValues.TaskUpdateURL
		client = http.DefaultClient
	}
	body := asanaTask.GetTaskUpdateBody(updateFields)
	bodyJson, err := json.Marshal(*body)
	if err != nil {
		return err
	}
	err = requestJSON(client, "PUT", taskUpdateURL, string(bodyJson), EmptyResponsePlaceholder)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to update asana task")
		return err
	}
	return nil
}

func (asanaTask AsanaTaskSource) GetTaskUpdateBody(updateFields *database.Task) *AsanaTasksUpdateBody {
	var dueDate *string
	if updateFields.DueDate != nil && updateFields.DueDate.Time() != time.Unix(0, 0) {
		dueDateString := updateFields.DueDate.Time().Format(constants.YEAR_MONTH_DAY_FORMAT)
		dueDate = &dueDateString
	}
	body := AsanaTasksUpdateBody{
		Data: AsanaTasksUpdateFields{
			Name:      updateFields.Title,
			HTMLNotes: updateFields.Body,
			DueOn:     dueDate,
			Completed: updateFields.IsCompleted,
		},
	}
	return &body
}

func (asanaTask AsanaTaskSource) CreateNewTask(db *mongo.Database, userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	return primitive.NilObjectID, errors.New("has not been implemented yet")
}

func (asanaTask AsanaTaskSource) CreateNewEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (asanaTask AsanaTaskSource) ModifyEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, eventID string, updateFields *EventModifyObject) error {
	return errors.New("has not been implemented yet")
}

func (asanaTask AsanaTaskSource) DeleteEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, externalID string, calendarID string) error {
	return errors.New("has not been implemented yet")
}

func (asanaTask AsanaTaskSource) AddComment(db *mongo.Database, userID primitive.ObjectID, accountID string, comment database.Comment, task *database.Task) error {
	return errors.New("has not been implemented yet")
}
