package external

import (
	"context"
	"errors"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/rs/zerolog/log"
	"github.com/shurcooL/graphql"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LinearTaskSource struct {
	Linear LinearService
}

type LinearUserInfoResponse struct {
}

type LinearTasksResponse struct {
}

type LinearTasksUpdateFields struct {
}

type LinearTasksUpdateBody struct {
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

	client, err := getLinearClient(linearTask.Linear.Config.ConfigValues.TaskFetchURL, db, userID, accountID)
	if err != nil {
		log.Error().Err(err).Msg("unable to create linear client")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
		return
	}

	meQuery, err := GetLinearMeStruct(client)
	if err != nil {
		log.Error().Err(err).Msg("unable to get linear user details")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
		return
	}

	variables := map[string]interface{}{
		"email": graphql.String(meQuery.Viewer.Email), // TODO: using ID doesn't work for some reason
	}
	var query struct {
		Issues struct {
			Nodes []struct {
				Id          graphql.ID
				Title       graphql.String
				Description graphql.String
				Url         graphql.String
				CreatedAt   graphql.String
				Assignee    struct {
					Id    graphql.ID
					Name  graphql.String
					Email graphql.String
				}
			}
		} `graphql:"issues(filter: {state: {name: {neq: \"Done\"}}, assignee: {email: {eq: $email}}})"`
	}

	err = client.Query(context.Background(), &query, variables)
	if err != nil {
		log.Error().Err(err).Interface("query", query).Msg("could not execute query")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
	}

	var tasks []*database.Item
	for _, task := range query.Issues.Nodes {
		createdAt, _ := time.Parse("2006-01-02T15:04:05.000Z", string(task.CreatedAt))
		task := &database.Item{
			TaskBase: database.TaskBase{
				UserID:            userID,
				IDExternal:        task.Id.(string),
				IDTaskSection:     constants.IDTaskSectionDefault,
				Deeplink:          string(task.Url),
				SourceID:          TASK_SOURCE_ID_LINEAR,
				Title:             string(task.Title),
				Body:              string(task.Description),
				SourceAccountID:   accountID,
				CreatedAtExternal: primitive.NewDateTimeFromTime(createdAt),
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
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
			log.Error().Err(err).Msg("could not create task")
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

	result <- TaskResult{Tasks: tasks}
}

func (linearTask LinearTaskSource) GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil)
}

func (linearTask LinearTaskSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskChangeableFields) error {
	return errors.New("has not been implemented yet")
}

func (linearTask LinearTaskSource) GetTaskUpdateBody(updateFields *database.TaskChangeableFields) *LinearTasksUpdateBody {
	return &LinearTasksUpdateBody{}
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

func (linearTask LinearTaskSource) ModifyThread(userID primitive.ObjectID, accountID string, threadID primitive.ObjectID, isUnread *bool, IsArchived *bool) error {
	return nil
}
