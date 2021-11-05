package external

import (
	"errors"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AsanaTaskSource struct {
	Asana AsanaService
}

func (AsanaTask AsanaTaskSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult) {
	result <- emptyEmailResult(nil)
}

func (AsanaTask AsanaTaskSource) GetEvents(userID primitive.ObjectID, accountID string, timezoneOffsetMinutes int, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (AsanaTask AsanaTaskSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	result <- emptyTaskResult(errors.New("missing authToken or siteConfiguration"))
}

func (AsanaTask AsanaTaskSource) MarkAsDone(userID primitive.ObjectID, accountID string, issueID string) error {
	return errors.New("missing token or siteConfiguration")
}

func (AsanaTask AsanaTaskSource) Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, body string) error {
	return errors.New("cannot reply to an asana task")
}

func (AsanaTask AsanaTaskSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	return errors.New("cannot create new asana task")
}
