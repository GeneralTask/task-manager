package external

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskSource interface {
	// TODO: update all these method signatures once refactor is finalized
	GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult)
	GetEvents(userID primitive.ObjectID, accountID string, timezoneOffsetMinutes int, result chan<- CalendarResult)
	GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult)
	MarkAsDone(userID primitive.ObjectID, accountID string, taskID string) error
	Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, body string) error
}
