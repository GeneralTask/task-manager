package external

import (
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskSource interface {
	GetEmails(userID primitive.ObjectID, accountID string, latestHistoryID uint64, result chan<- EmailResult, fullRefresh bool)
	GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult)
	GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult)
	GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult)
	Reply(userID primitive.ObjectID, accountID string, messageID primitive.ObjectID, emailContents EmailContents) error
	SendEmail(userID primitive.ObjectID, accountID string, email EmailContents) error
	CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error)
	CreateNewEvent(userID primitive.ObjectID, accountID string, event EventCreateObject) error
	ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskItemChangeableFields, task *database.Item) error
	ModifyMessage(userID primitive.ObjectID, accountID string, emailID string, updateFields *database.MessageChangeable) error
	ModifyThread(userID primitive.ObjectID, accountID string, threadID primitive.ObjectID, isUnread *bool, IsArchived *bool) error
}

type TaskCreationObject struct {
	Title          string
	Body           string
	DueDate        *time.Time
	TimeAllocation *int64
	IDTaskSection  primitive.ObjectID
}

type Attendee struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type EventCreateObject struct {
	AccountID         string     `json:"account_id" binding:"required"`
	Summary           string     `json:"summary"`
	Location          string     `json:"location"`
	Description       string     `json:"description"`
	TimeZone          string     `json:"time_zone"`
	DatetimeStart     *time.Time `json:"datetime_start" binding:"required"`
	DatetimeEnd       *time.Time `json:"datetime_end" binding:"required"`
	Attendees         []Attendee `json:"attendees"`
	AddConferenceCall bool       `json:"add_conference_call"`
}
