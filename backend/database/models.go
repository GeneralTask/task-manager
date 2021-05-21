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
	GoogleID string             `bson:"google_id"`
	Email    string             `bson:"email"`
}

// InternalAPIToken model
type InternalAPIToken struct {
	ID     primitive.ObjectID `bson:"_id,omitempty"`
	Token  string             `bson:"token"`
	UserID primitive.ObjectID `bson:"user_id"`
}

// ExternalAPIToken model
type ExternalAPIToken struct {
	ID     primitive.ObjectID `bson:"_id,omitempty"`
	Source string             `bson:"source"`
	Token  string             `bson:"token"`
	UserID primitive.ObjectID `bson:"user_id"`
}

type JIRASiteConfiguration struct {
	ID            primitive.ObjectID `bson:"_id,omitempty"`
	UserID 	      primitive.ObjectID `bson:"user_id"`
	CloudID 	  string             `bson:"cloud_id"`
	SiteURL		  string             `bson:"site_url"`
}

type StateToken struct {
	Token  primitive.ObjectID `bson:"_id,omitempty"`
	UserID primitive.ObjectID `bson:"user_id"`
}

// Task json & mongo model
type TaskBase struct {
	ID               primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID           primitive.ObjectID `json:"-" bson:"user_id"`
	IDExternal       string             `json:"-" bson:"id_external"`
	IDOrdering       int                `json:"id_ordering" bson:"id_ordering"`
	IsCompleted      bool               `json:"-" bson:"is_completed"`
	IsCompletable    bool				 `json:"is_completable" bson:"is_completable"`
	Sender           string             `json:"sender" bson:"sender"`
	Source           string             `json:"source" bson:"source"`
	Deeplink         string             `json:"deeplink" bson:"deeplink"`
	Title            string             `json:"title" bson:"title"`
	Logo             string             `json:"logo_url" bson:"logo"`
	HasBeenReordered bool               `json:"has_been_reordered" bson:"has_been_reordered"`
	//time in nanoseconds
	TimeAllocation int64 `json:"time_allocated" bson:"time_allocated"`
}

type CalendarEvent struct {
	TaskBase      `bson:",inline"`
	DatetimeEnd   primitive.DateTime `bson:"datetime_end"`
	DatetimeStart primitive.DateTime `bson:"datetime_start"`
}

type CalendarEventChangeableFields struct {
	Title         string             `json:"title" bson:"title,omitempty"`
	DatetimeEnd   primitive.DateTime `bson:"datetime_end,omitempty"`
	DatetimeStart primitive.DateTime `bson:"datetime_start,omitempty"`
}

type Email struct {
	TaskBase     `bson:",inline"`
	SenderDomain string             `bson:"sender_domain"`
	TimeSent     primitive.DateTime `bson:"time_sent"`
}

type Task struct {
	TaskBase   `bson:",inline"`
	DueDate    primitive.DateTime `bson:"due_date"`
	Priority   int                `bson:"priority"`
	TaskNumber int                `bson:"task_number"`
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
	IsCompletable bool
}

var TaskSourceGoogleCalendar = TaskSource{"Google Calendar", "/images/gcal.svg", false}
var TaskSourceGmail = TaskSource{"Gmail", "/images/gmail.svg", true}
var TaskSourceJIRA = TaskSource{"Jira", "/images/jira.svg", true}
