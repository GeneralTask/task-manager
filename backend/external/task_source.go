package external

import (
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskSource interface {
	GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult)
	GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult)
	GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult)
	CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error)
	ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.Task, task *database.Task) error
	CreateNewEvent(userID primitive.ObjectID, accountID string, event EventCreateObject) error
	ModifyEvent(userID primitive.ObjectID, accountID string, eventID string, updateFields *EventModifyObject) error
	DeleteEvent(userID primitive.ObjectID, accountID string, externalID string) error
}

type TaskCreationObject struct {
	Title              string
	Body               string
	DueDate            *time.Time
	TimeAllocation     *int64
	IDTaskSection      primitive.ObjectID
	SlackMessageParams database.SlackMessageParams
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

type TaskChangeable struct {
	PriorityID         *string                      `bson:"priority_id,omitempty"`
	PriorityNormalized *float64                     `bson:"priority_normalized,omitempty"`
	TaskNumber         *int                         `bson:"task_number,omitempty"`
	Comments           *[]database.Comment          `bson:"comments,omitempty"`
	Status             *database.ExternalTaskStatus `bson:"status,omitempty"`
	// Used to cache the current status before marking the task as done
	PreviousStatus  *database.ExternalTaskStatus `bson:"previous_status,omitempty"`
	CompletedStatus *database.ExternalTaskStatus `bson:"completed_status,omitempty"`
}

type TaskItemChangeableFields struct {
	Task           TaskChangeable     `bson:"task,omitempty"`
	Title          *string            `json:"title" bson:"title,omitempty"`
	Body           *string            `json:"body" bson:"body,omitempty"`
	DueDate        primitive.DateTime `json:"due_date" bson:"due_date,omitempty"`
	TimeAllocation *int64             `json:"time_duration" bson:"time_allocated,omitempty"`
	IsCompleted    *bool              `json:"is_completed" bson:"is_completed,omitempty"`
	CompletedAt    primitive.DateTime `json:"completed_at" bson:"completed_at"`
}

type TaskModifyParams struct {
	IDOrdering    *int    `json:"id_ordering"`
	IDTaskSection *string `json:"id_task_section"`
	TaskItemChangeableFields
}
