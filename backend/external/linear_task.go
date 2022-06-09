package external

import (
	"errors"
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

func (linearTask LinearTaskSource) GetEmails(userID primitive.ObjectID, accountID string, historyID uint64, result chan<- EmailResult, fullRefresh bool) {
	result <- emptyEmailResult(nil)
}

func (linearTask LinearTaskSource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (linearTask LinearTaskSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	result <- emptyTaskResult(nil)
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

func (linearTask LinearTaskSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	return primitive.NilObjectID, errors.New("has not been implemented yet")
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
