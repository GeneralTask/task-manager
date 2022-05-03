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

type LinearTaskSource struct {
	Linear LinearService
}

type LinearUserInfoResponse struct {
	Data struct {
		Workspaces []struct {
			ID string `json:"gid"`
		} `json:"workspaces"`
	} `json:"data"`
}

type LinearTasksResponse struct {
	Data []struct {
		GID          string             `json:"gid"`
		DueOn        string             `json:"due_on"`
		HTMLNotes    string             `json:"html_notes"`
		Name         string             `json:"name"`
		PermalinkURL string             `json:"permalink_url"`
		CreatedAt    primitive.DateTime `json:"created_at"`
	} `json:"data"`
}

type LinearTasksUpdateFields struct {
	Name      *string `json:"name,omitempty"`
	HTMLNotes *string `json:"html_notes,omitempty"`
	DueOn     *string `json:"due_on,omitempty"`
	Completed *bool   `json:"completed,omitempty"`
}

type LinearTasksUpdateBody struct {
	Data LinearTasksUpdateFields `json:"data"`
}

func (linearTask LinearTaskSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult, fullRefresh bool) {
	result <- emptyEmailResult(nil)
}

func (linearTask LinearTaskSource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (linearTask LinearTaskSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
		return
	}
	defer dbCleanup()

	client := getLinearHttpClient(db, userID, accountID)

	userInfoURL := "https://app.linear.com/api/1.0/users/me"
	if linearTask.Linear.ConfigValues.UserInfoURL != nil {
		userInfoURL = *linearTask.Linear.ConfigValues.UserInfoURL
		client = http.DefaultClient
	}

	var userInfo LinearUserInfoResponse
	err = getJSON(client, userInfoURL, &userInfo)
	if err != nil || len(userInfo.Data.Workspaces) == 0 {
		log.Error().Msgf("failed to get linear workspace ID: %v", err)
		if err == nil {
			err = errors.New("user has not workspaces")
		}
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
		return
	}
	workspaceID := userInfo.Data.Workspaces[0].ID

	taskFetchURL := fmt.Sprintf("https://app.linear.com/api/1.0/tasks/?assignee=me&workspace=%s&completed_since=3022-01-01&opt_fields=this.html_notes,this.name,this.due_at,this.due_on,this.permalink_url", workspaceID)
	if linearTask.Linear.ConfigValues.TaskFetchURL != nil {
		taskFetchURL = *linearTask.Linear.ConfigValues.TaskFetchURL
		client = http.DefaultClient
	} else if client == nil {
		client = getLinearHttpClient(db, userID, accountID)
	}

	var linearTasks LinearTasksResponse
	err = getJSON(client, taskFetchURL, &linearTasks)
	if err != nil {
		log.Error().Msgf("failed to fetch linear tasks: %v", err)
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
		return
	}

	var tasks []*database.Item
	for _, linearTaskData := range linearTasks.Data {
		task := &database.Item{
			TaskBase: database.TaskBase{
				UserID:            userID,
				IDExternal:        linearTaskData.GID,
				IDTaskSection:     constants.IDTaskSectionToday,
				Deeplink:          linearTaskData.PermalinkURL,
				SourceID:          TASK_SOURCE_ID_LINEAR,
				Title:             linearTaskData.Name,
				Body:              linearTaskData.HTMLNotes,
				SourceAccountID:   accountID,
				CreatedAtExternal: linearTaskData.CreatedAt,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		}
		dueDate, err := time.Parse("2006-01-02", linearTaskData.DueOn)
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
			database.TaskChangeableFields{
				Title:       &task.Title,
				Body:        &task.TaskBase.Body,
				DueDate:     task.DueDate,
				IsCompleted: &isCompleted,
			},
			nil,
			false,
		)
		if err != nil {
			result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
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

func (linearTask LinearTaskSource) GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil)
}

func (linearTask LinearTaskSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskChangeableFields) error {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()

	client := getLinearHttpClient(db, userID, accountID)

	taskUpdateURL := fmt.Sprintf("https://app.linear.com/api/1.0/tasks/%s/", issueID)
	if linearTask.Linear.ConfigValues.TaskUpdateURL != nil {
		taskUpdateURL = *linearTask.Linear.ConfigValues.TaskUpdateURL
		client = http.DefaultClient
	}
	body := linearTask.GetTaskUpdateBody(updateFields)
	bodyJson, err := json.Marshal(*body)
	if err != nil {
		return err
	}
	err = requestJSON(client, "PUT", taskUpdateURL, string(bodyJson), EmptyResponsePlaceholder)
	if err != nil {
		log.Error().Msgf("failed to update linear task: %v", err)
		return err
	}
	return nil
}

func (linearTask LinearTaskSource) GetTaskUpdateBody(updateFields *database.TaskChangeableFields) *LinearTasksUpdateBody {
	var dueDate *string
	if updateFields.DueDate.Time() != time.Unix(0, 0) {
		dueDateString := updateFields.DueDate.Time().Format(constants.YEAR_MONTH_DAY_FORMAT)
		dueDate = &dueDateString
	}
	body := LinearTasksUpdateBody{
		Data: LinearTasksUpdateFields{
			Name:      updateFields.Title,
			HTMLNotes: updateFields.Body,
			DueOn:     dueDate,
			Completed: updateFields.IsCompleted,
		},
	}
	return &body
}

func (linearTask LinearTaskSource) Reply(userID primitive.ObjectID, accountID string, messageID primitive.ObjectID, emailContents EmailContents) error {
	return errors.New("cannot reply to an linear task")
}

func (linearTask LinearTaskSource) SendEmail(userID primitive.ObjectID, accountID string, email EmailContents) error {
	return errors.New("cannot send email for linear source")
}

func (linearTask LinearTaskSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	return errors.New("cannot create new linear task")
}

func (linearTask LinearTaskSource) CreateNewEvent(userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (linearTask LinearTaskSource) ModifyMessage(userID primitive.ObjectID, accountID string, emailID string, updateFields *database.MessageChangeable) error {
	return nil
}

func (linearTask LinearTaskSource) ModifyThread(userID primitive.ObjectID, accountID string, threadID primitive.ObjectID, isUnread *bool) error {
	return nil
}
