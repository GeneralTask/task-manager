package external

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/settings"
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

func (asanaTask AsanaTaskSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult) {
	result <- emptyEmailResult(nil)
}

func (asanaTask AsanaTaskSource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (asanaTask AsanaTaskSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyTaskResult(err)
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
		log.Printf("failed to get asana workspace ID: %v", err)
		if err == nil {
			err = errors.New("user has not workspaces")
		}
		result <- emptyTaskResult(err)
		return
	}
	workspaceID := userInfo.Data.Workspaces[0].ID

	taskFetchURL := fmt.Sprintf("https://app.asana.com/api/1.0/tasks/?assignee=me&workspace=%s&completed_since=2022-01-01&opt_fields=this.html_notes,this.name,this.due_at,this.due_on,this.permalink_url", workspaceID)
	if asanaTask.Asana.ConfigValues.TaskFetchURL != nil {
		taskFetchURL = *asanaTask.Asana.ConfigValues.TaskFetchURL
		client = http.DefaultClient
	} else if client == nil {
		client = getAsanaHttpClient(db, userID, accountID)
	}

	var asanaTasks AsanaTasksResponse
	err = getJSON(client, taskFetchURL, &asanaTasks)
	if err != nil {
		log.Printf("failed to fetch asana tasks: %v", err)
		result <- emptyTaskResult(err)
		return
	}

	var tasks []*database.Task
	for _, asanaTaskData := range asanaTasks.Data {
		task := &database.Task{
			TaskBase: database.TaskBase{
				UserID:            userID,
				IDExternal:        asanaTaskData.GID,
				IDTaskSection:     constants.IDTaskSectionToday,
				Deeplink:          asanaTaskData.PermalinkURL,
				SourceID:          TASK_SOURCE_ID_ASANA,
				Title:             asanaTaskData.Name,
				Body:              asanaTaskData.HTMLNotes,
				TimeAllocation:    settings.GetDefaultTaskDuration(db, userID),
				SourceAccountID:   accountID,
				CreatedAtExternal: asanaTaskData.CreatedAt,
			},
		}
		dueDate, err := time.Parse("2006-01-02", asanaTaskData.DueOn)
		if err == nil {
			task.DueDate = primitive.NewDateTimeFromTime(dueDate)
		}
		var dbTask database.Task
		res, err := database.UpdateOrCreateTask(
			db,
			userID,
			task.IDExternal,
			task.SourceID,
			task,
			database.TaskChangeableFields{
				Title:   &task.Title,
				DueDate: task.DueDate,
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
		tasks = append(tasks, task)
	}

	result <- TaskResult{
		Tasks: tasks,
	}
}

func (asanaTask AsanaTaskSource) GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil)
}

func (asanaTask AsanaTaskSource) MarkAsDone(userID primitive.ObjectID, accountID string, issueID string) error {
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
	err = requestJSON(client, "PUT", taskUpdateURL, `{"data": {"completed": true}}`, EmptyResponsePlaceholder)
	if err != nil {
		log.Printf("failed to fetch asana tasks: %v", err)
		return err
	}
	return nil
}

func (asanaTask AsanaTaskSource) Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, body string) error {
	return errors.New("cannot reply to an asana task")
}

func (asanaTask AsanaTaskSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	return errors.New("cannot create new asana task")
}

func (asanaTask AsanaTaskSource) ModifyTask(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, updateFields *database.TaskChangeableFields) error {
	return nil
}
