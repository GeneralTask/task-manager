package external

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskSource interface {
	GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult)
	MarkAsDone(userID primitive.ObjectID, accountID string, issueID string) error
}
