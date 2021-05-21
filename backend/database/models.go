package database

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// https://www.mongodb.com/blog/post/quick-start-golang--mongodb--modeling-documents-with-go-data-structures

// APISource is a distinct API with its own token
type APISource string

const (
	// Google APISource
	Google APISource = "google"
)

// User model
// todo: consider putting api tokens into user document
type User struct {
	ID       primitive.ObjectID `bson:"_id,omitempty"`
	GoogleID string             `bson:"google_id,omitempty"`
	Email    string             `bson:"email,omitempty"`
}

// InternalAPIToken model
type InternalAPIToken struct {
	ID     primitive.ObjectID `bson:"_id,omitempty"`
	Token  string             `bson:"token,omitempty"`
	UserID primitive.ObjectID `bson:"user_id,omitempty"`
}

// ExternalAPIToken model
type ExternalAPIToken struct {
	ID     primitive.ObjectID `bson:"_id,omitempty"`
	Source string             `bson:"source,omitempty"`
	Token  string             `bson:"token,omitempty"`
	UserID primitive.ObjectID `bson:"user_id,omitempty"`
}

type StateToken struct {
	Token  primitive.ObjectID `bson:"_id,omitempty"`
	UserID primitive.ObjectID `bson:"user_id,omitempty"`
}

// Task json & mongo model
type TaskBase struct {
	ID               primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID           primitive.ObjectID `json:"-" bson:"user_id,omitempty"`
	IDExternal       string             `json:"-" bson:"id_external,omitempty"`
	IDOrdering       int                `json:"id_ordering" bson:"id_ordering,omitempty"`
	IsCompleted      bool               `json:"-" bson:"is_completed,omitempty"`
	Sender           string             `json:"sender" bson:"sender,omitempty"`
	Source           string             `json:"source" bson:"source,omitempty"`
	Deeplink         string             `json:"deeplink" bson:"deeplink,omitempty"`
	Title            string             `json:"title" bson:"title,omitempty"`
	Logo             string             `json:"logo_url" bson:"logo,omitempty"`
	HasBeenReordered bool               `json:"has_been_reordered" bson:"has_been_reordered,omitempty"`
	//time in nanoseconds
	TimeAllocation int64 `json:"time_allocated" bson:"time_allocated,omitempty"`
}

type CalendarEvent struct {
	TaskBase      `bson:",inline"`
	DatetimeEnd   primitive.DateTime `bson:"datetime_end,omitempty"`
	DatetimeStart primitive.DateTime `bson:"datetime_start,omitempty"`
}

type CalendarEventChangeableFields struct {
	Title         string             `json:"title" bson:"title,omitempty"`
	DatetimeEnd   primitive.DateTime `bson:"datetime_end,omitempty"`
	DatetimeStart primitive.DateTime `bson:"datetime_start,omitempty"`
}

type Email struct {
	TaskBase     `bson:",inline"`
	SenderDomain string             `bson:"sender_domain,omitempty"`
	TimeSent     primitive.DateTime `bson:"time_sent,omitempty"`
}

type Task struct {
	TaskBase   `bson:",inline"`
	DueDate    primitive.DateTime `bson:"due_date,omitempty"`
	Priority   int                `bson:"priority,omitempty"`
	TaskNumber int                `bson:"task_number,omitempty"`
}

type TaskChangeableFields struct {
	Title    string             `json:"title" bson:"title,omitempty"`
	DueDate  primitive.DateTime `bson:"due_date,omitempty"`
	Priority int                `bson:"priority,omitempty"`
}

type TaskGroup struct {
	TaskGroupType `json:"type"`
	StartTime     string      `json:"datetime_start"`
	Duration      int64       `json:"time_duration"`
	Tasks         []*TaskBase `json:"tasks"`
}

type TaskGroupType string

const (
	ScheduledTask    TaskGroupType = "scheduled_task"
	UnscheduledGroup TaskGroupType = "unscheduled_group"
)

type TaskSource struct {
	Name string
	Logo string
}

var TaskSourceGoogleCalendar = TaskSource{"gcal", "/images/gcal.svg"}
var TaskSourceGmail = TaskSource{"gmail", "/images/gmail.svg"}
var TaskSourceJIRA = TaskSource{"jira", "/images/jira.svg"}
