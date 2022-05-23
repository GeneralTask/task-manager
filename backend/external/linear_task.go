package external

import (
	"context"
	"errors"
	"fmt"
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

	filter := fmt.Sprintf("issues(filter: {assignee: {id: {eq: \"%s\"}}})", meQuery.Viewer.Id)
	var query struct {
		Issues struct {
			Nodes []struct {
				Id    graphql.String
				Title graphql.String
				//Email graphql.String
			}
			//} `graphql:"issues(filter: {assignee: {name: {eq: \"John Reinstra\"}}})"`
		} `graphql:filter`
	}

	err = client.Query(context.Background(), &query, nil)
	if err != nil {
		log.Error().Err(err).Interface("query", query).Msg("could not execute query")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
	}
	log.Debug().Interface("query", query).Send()

	result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
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

func (linearTask LinearTaskSource) ModifyThread(userID primitive.ObjectID, accountID string, threadID primitive.ObjectID, isUnread *bool) error {
	return nil
}
