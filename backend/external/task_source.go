package external

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskSource interface {
	GetEvents(userID primitive.ObjectID, accountID string, timezoneOffsetMinutes int, result chan<- CalendarResult)
	GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult)
	MarkAsDone(userID primitive.ObjectID, accountID string, issueID string) error
}
