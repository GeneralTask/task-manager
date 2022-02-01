package database

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// https://www.mongodb.com/blog/post/quick-start-golang--mongodb--modeling-documents-with-go-data-structures

// User model
type User struct {
	ID       primitive.ObjectID `bson:"_id,omitempty"`
	GoogleID string             `bson:"google_id"`
	Email    string             `bson:"email"`
	Name     string             `bson:"name"`
}

// InternalAPIToken model
type InternalAPIToken struct {
	ID     primitive.ObjectID `bson:"_id,omitempty"`
	Token  string             `bson:"token"`
	UserID primitive.ObjectID `bson:"user_id"`
}

// ExternalAPIToken model
type ExternalAPIToken struct {
	ID             primitive.ObjectID `bson:"_id,omitempty"`
	ServiceID      string             `bson:"service_id"`
	Token          string             `bson:"token"`
	UserID         primitive.ObjectID `bson:"user_id"`
	AccountID      string             `bson:"account_id"`
	DisplayID      string             `bson:"display_id"`
	IsUnlinkable   bool               `bson:"is_unlinkable"`
	IsPrimaryLogin bool               `bson:"is_primary_login"`
}

type AtlassianSiteConfiguration struct {
	ID      primitive.ObjectID `bson:"_id,omitempty"`
	UserID  primitive.ObjectID `bson:"user_id"`
	CloudID string             `bson:"cloud_id"`
	SiteURL string             `bson:"site_url"`
}

type JIRAPriority struct {
	ID              primitive.ObjectID `bson:"_id,omitempty"`
	UserID          primitive.ObjectID `bson:"user_id"`
	JIRAID          string             `bson:"jira_id"`
	IntegerPriority int                `bson:"integer_priority"`
}

type StateToken struct {
	Token  primitive.ObjectID `bson:"_id,omitempty"`
	UserID primitive.ObjectID `bson:"user_id"`
}

type Oauth1RequestSecret struct {
	ID            primitive.ObjectID `bson:"_id,omitempty"`
	UserID        primitive.ObjectID `bson:"user_id"`
	RequestSecret string             `bson:"request_secret"`
}

type TaskRecord struct {
	TaskBase `bson:",inline"`
}

// Task json & mongo model
type TaskBase struct {
	ID               primitive.ObjectID `bson:"_id,omitempty"`
	UserID           primitive.ObjectID `bson:"user_id"`
	IDExternal       string             `bson:"id_external"`
	IDOrdering       int                `bson:"id_ordering"`
	IDTaskSection    primitive.ObjectID `bson:"id_task_section"`
	IsCompleted      bool               `bson:"is_completed"`
	Sender           string             `bson:"sender"`
	SourceID         string             `bson:"source_id"`
	SourceAccountID  string             `bson:"source_account_id"`
	Deeplink         string             `bson:"deeplink"`
	Title            string             `bson:"title"`
	Body             string             `bson:"body"`
	HasBeenReordered bool               `bson:"has_been_reordered"`
	DueDate          primitive.DateTime `bson:"due_date"`
	//time in nanoseconds
	TimeAllocation    int64              `bson:"time_allocated"`
	ConferenceCall    *ConferenceCall    `bson:"conference_call"`
	CreatedAtExternal primitive.DateTime `bson:"created_at_external"`
}

type PullRequest struct {
	TaskBase `bson:",inline"`
	Opened   primitive.DateTime `bson:"opened"`
}

type PullRequestChangeableFields struct {
	Title string `bson:"title,omitempty"`
	Body  string `bson:"body,omitempty"`
}

type CalendarEvent struct {
	TaskBase      `bson:",inline"`
	DatetimeEnd   primitive.DateTime `bson:"datetime_end"`
	DatetimeStart primitive.DateTime `bson:"datetime_start"`
}

type CalendarEventChangeableFields struct {
	Title         string             `bson:"title,omitempty"`
	Body          string             `bson:"body,omitempty"`
	DatetimeEnd   primitive.DateTime `bson:"datetime_end,omitempty"`
	DatetimeStart primitive.DateTime `bson:"datetime_start,omitempty"`
}

type Email struct {
	TaskBase     `bson:",inline"`
	ThreadID     string `bson:"thread_id"`
	SenderDomain string `bson:"sender_domain"`
}

type Task struct {
	TaskBase           `bson:",inline"`
	PriorityID         string  `bson:"priority_id"`
	PriorityNormalized float64 `bson:"priority_normalized"`
	TaskNumber         int     `bson:"task_number"`
}

type TaskChangeableFields struct {
	PriorityID         string  `bson:"priority_id,omitempty"`
	PriorityNormalized float64 `bson:"priority_normalized,omitempty"`

	Title          *string            `json:"title" bson:"title,omitempty"`
	Body           *string            `json:"body" bson:"body,omitempty"`
	DueDate        primitive.DateTime `json:"due_date" bson:"due_date,omitempty"`
	TimeAllocation *int64             `json:"time_duration" bson:"time_allocated,omitempty"`
	IsCompleted    *bool              `json:"is_completed" bson:"is_completed,omitempty"`
}

type UserSetting struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	UserID     primitive.ObjectID `bson:"user_id"`
	FieldKey   string             `bson:"field_key"`
	FieldValue string             `bson:"field_value"`
}

type WaitlistEntry struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Email     string             `bson:"email"`
	HasAccess bool               `bson:"has_access"`
	CreatedAt primitive.DateTime `bson:"created_at"`
}

type ConferenceCall struct {
	Platform string `bson:"platform"`
	Logo     string `bson:"logo"`
	URL      string `bson:"url"`
}

type LogEvent struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	UserID    primitive.ObjectID `bson:"user_id"`
	EventType string             `bson:"event_type"`
	CreatedAt primitive.DateTime `bson:"created_at"`
}
