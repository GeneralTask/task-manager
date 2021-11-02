package external

import "go.mongodb.org/mongo-driver/bson/primitive"

type GeneralTaskTaskSource struct{}

func (GeneralTask GeneralTaskTaskSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult) {
}

func (GeneralTask GeneralTaskTaskSource) GetEvents(userID primitive.ObjectID, accountID string, timezoneOffsetMinutes int, result chan<- CalendarResult) {
}

func (GeneralTask GeneralTaskTaskSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
}

func (GeneralTask GeneralTaskTaskSource) MarkAsDone(userID primitive.ObjectID, accountID string, taskID string) error {
	return nil
}

func (GeneralTask GeneralTaskTaskSource) Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, body string) error {
	return nil
}

func (GeneralTask GeneralTaskTaskSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	return nil
}
