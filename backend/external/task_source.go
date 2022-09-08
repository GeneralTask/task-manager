package external

import (
	"time"

	"go.mongodb.org/mongo-driver/mongo"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskSource interface {
	GetEvents(db *mongo.Database, userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult)
	GetTasks(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- TaskResult)
	GetPullRequests(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- PullRequestResult)
	CreateNewTask(db *mongo.Database, userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error)
	ModifyTask(db *mongo.Database, userID primitive.ObjectID, accountID string, issueID string, updateFields *database.Task, task *database.Task) error
	CreateNewEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, event EventCreateObject) error
	ModifyEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, eventID string, updateFields *EventModifyObject) error
	DeleteEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, externalID string) error
}

type TaskCreationObject struct {
	Title              string
	Body               string
	DueDate            *time.Time
	TimeAllocation     *int64
	IDTaskSection      primitive.ObjectID
	ParentTaskID       primitive.ObjectID
	SlackMessageParams database.SlackMessageParams
}

type Attendee struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type EventCreateObject struct {
	ID                primitive.ObjectID `json:"id,omitempty"`
	AccountID         string             `json:"account_id" binding:"required"`
	Summary           string             `json:"summary,omitempty"`
	Location          string             `json:"location,omitempty"`
	Description       string             `json:"description,omitempty"`
	TimeZone          string             `json:"time_zone,omitempty"`
	DatetimeStart     *time.Time         `json:"datetime_start" binding:"required"`
	DatetimeEnd       *time.Time         `json:"datetime_end" binding:"required"`
	Attendees         []Attendee         `json:"attendees,omitempty"`
	AddConferenceCall bool               `json:"add_conference_call,omitempty"`
	LinkedTaskID      primitive.ObjectID `json:"task_id,omitempty"`
}

type EventModifyObject struct {
	AccountID         string      `json:"account_id" binding:"required"`
	Summary           *string     `json:"summary"`
	Location          *string     `json:"location"`
	Description       *string     `json:"description"`
	TimeZone          *string     `json:"time_zone"`
	DatetimeStart     *time.Time  `json:"datetime_start"`
	DatetimeEnd       *time.Time  `json:"datetime_end"`
	Attendees         *[]Attendee `json:"attendees"`
	AddConferenceCall *bool       `json:"add_conference_call"`
}
