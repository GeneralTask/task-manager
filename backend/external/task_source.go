package external

import (
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskSource interface {
	GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult)
	GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult)
	GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult)
	GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult)
	Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, body string) error
	CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error
	ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskChangeableFields) error
	ModifyMessage(userID primitive.ObjectID, accountID string, emailID string, updateFields *database.MessageChangeable) error
}

type TaskCreationObject struct {
	Title          string
	Body           string
	DueDate        *time.Time
	TimeAllocation *int64
	IDTaskSection  primitive.ObjectID
}
