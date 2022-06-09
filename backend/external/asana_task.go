package external

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/rs/zerolog/log"
	"net/http"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AsanaTaskSource struct {
	Asana AsanaService
}

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

func (asanaTask AsanaTaskSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult, fullRefresh bool) {
	result <- emptyEmailResult(nil)
}

func (asanaTask AsanaTaskSource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (asanaTask AsanaTaskSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_ASANA)
		return
	}
	defer dbCleanup()

	client := getAsanaHttpClient(db, userID, accountID)

	userInfoURL := "https://app.asana.com/api/1.0/users/me"
	if asanaTask.Asana.ConfigValues.UserInfoURL != nil {
		userInfoURL = *asanaTask.Asana.ConfigValues.UserInfoURL
		client = http.DefaultClient
	}

	var userInfo AsanaUserInfoResponse
	err = getJSON(client, userInfoURL, &userInfo)
	if err != nil || len(userInfo.Data.Workspaces) == 0 {
		log.Error().Err(err).Msg("failed to get asana workspace ID")
		if err == nil {
			err = errors.New("user has not workspaces")
		}
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_ASANA)
		return
	}
	workspaceID := userInfo.Data.Workspaces[0].ID

	taskFetchURL := fmt.Sprintf("https://app.asana.com/api/1.0/tasks/?assignee=me&workspace=%s&completed_since=3022-01-01&opt_fields=this.html_notes,this.name,this.due_at,this.due_on,this.permalink_url", workspaceID)
	if asanaTask.Asana.ConfigValues.TaskFetchURL != nil {
		taskFetchURL = *asanaTask.Asana.ConfigValues.TaskFetchURL
		client = http.DefaultClient
	} else if client == nil {
		client = getAsanaHttpClient(db, userID, accountID)
	}

	var asanaTasks AsanaTasksResponse
	err = getJSON(client, taskFetchURL, &asanaTasks)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch asana tasks")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_ASANA)
		return
	}

	var tasks []*database.Item
	for _, asanaTaskData := range asanaTasks.Data {
		task := &database.Item{
			TaskBase: database.TaskBase{
				UserID:            userID,
				IDExternal:        asanaTaskData.GID,
				IDTaskSection:     constants.IDTaskSectionDefault,
				Deeplink:          asanaTaskData.PermalinkURL,
				SourceID:          TASK_SOURCE_ID_ASANA,
				Title:             asanaTaskData.Name,
				Body:              asanaTaskData.HTMLNotes,
				SourceAccountID:   accountID,
				CreatedAtExternal: asanaTaskData.CreatedAt,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		}
		dueDate, err := time.Parse("2006-01-02", asanaTaskData.DueOn)
		if err == nil {
			task.DueDate = primitive.NewDateTimeFromTime(dueDate)
		}
		isCompleted := false
		dbTask, err := database.UpdateOrCreateTask(
			db,
			userID,
			task.IDExternal,
			task.SourceID,
			task,
			database.TaskItemChangeableFields{
				Title:       &task.Title,
				Body:        &task.TaskBase.Body,
				DueDate:     task.DueDate,
				IsCompleted: &isCompleted,
			},
			nil,
			false,
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

func (asanaTask AsanaTaskSource) GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil)
}

func (asanaTask AsanaTaskSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskItemChangeableFields) error {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()

	client := getAsanaHttpClient(db, userID, accountID)

	taskUpdateURL := fmt.Sprintf("https://app.asana.com/api/1.0/tasks/%s/", issueID)
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
	if err != nil {
		log.Error().Err(err).Msg("failed to update asana task")
		return err
	}
	return nil
}

func (asanaTask AsanaTaskSource) GetTaskUpdateBody(updateFields *database.TaskItemChangeableFields) *AsanaTasksUpdateBody {
	var dueDate *string
	if updateFields.DueDate.Time() != time.Unix(0, 0) {
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

func (asanaTask AsanaTaskSource) Reply(userID primitive.ObjectID, accountID string, messageID primitive.ObjectID, emailContents EmailContents) error {
	return errors.New("cannot reply to an asana task")
}

func (asanaTask AsanaTaskSource) SendEmail(userID primitive.ObjectID, accountID string, email EmailContents) error {
	return errors.New("cannot send email for asana source")
}

func (asanaTask AsanaTaskSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	return primitive.NilObjectID, errors.New("has not been implemented yet")
}

func (asanaTask AsanaTaskSource) CreateNewEvent(userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (asanaTask AsanaTaskSource) ModifyMessage(userID primitive.ObjectID, accountID string, emailID string, updateFields *database.MessageChangeable) error {
	return nil
}

func (asanaTask AsanaTaskSource) ModifyThread(userID primitive.ObjectID, accountID string, threadID primitive.ObjectID, isUnread *bool, IsArchived *bool) error {
	return nil
}
