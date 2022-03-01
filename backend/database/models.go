package database

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// https://www.mongodb.com/blog/post/quick-start-golang--mongodb--modeling-documents-with-go-data-structures

// User model
type User struct {
	ID                    primitive.ObjectID `bson:"_id,omitempty"`
	GoogleID              string             `bson:"google_id"`
	Email                 string             `bson:"email"`
	Name                  string             `bson:"name"`
	LastRefreshed         primitive.DateTime `bson:"last_refreshed"`
	AgreedToTerms         bool               `bson:"agreed_to_terms"`
	OptedIntoMarketing    bool               `bson:"opted_into_marketing"`
	OptedOutOfArbitration bool               `bson:"opted_out_of_arbitration"`
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
	Token       primitive.ObjectID `bson:"_id,omitempty"`
	UserID      primitive.ObjectID `bson:"user_id"`
	UseDeeplink bool               `bson:"use_deeplink"`
}

type Oauth1RequestSecret struct {
	ID            primitive.ObjectID `bson:"_id,omitempty"`
	UserID        primitive.ObjectID `bson:"user_id"`
	RequestSecret string             `bson:"request_secret"`
}

type Item struct {
	TaskBase      `bson:",inline"`
	TaskType      `bson:"task_type"`
	Task          `bson:"task,omitempty"`
	Email         `bson:"email,omitempty"`
	CalendarEvent `bson:"calendar_event,omitempty"`
	PullRequest   `bson:"pull_request,omitempty"`
}

type TaskType struct {
	IsTask        bool `bson:"is_task"`
	IsMessage     bool `bson:"is_message"`
	IsEvent       bool `bson:"is_event"`
	IsPullRequest bool `bson:"is_pull_request"`
}

type TaskTypeChangeable struct {
	IsTask        *bool `bson:"is_task,omitempty"`
	IsMessage     *bool `bson:"is_message,omitempty"`
	IsEvent       *bool `bson:"is_event,omitempty"`
	IsPullRequest bool  `bson:"is_pull_request,omitempty"`
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
	Recipients       Recipients         `bson:"recipients"`
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
	CompletedAt       primitive.DateTime `bson:"completed_at"`
}

type PullRequest struct {
	Opened primitive.DateTime `bson:"opened"`
}

type PullRequestChangeableFields struct {
	Title string `bson:"title,omitempty"`
	Body  string `bson:"body,omitempty"`
}

type CalendarEvent struct {
	DatetimeEnd   primitive.DateTime `bson:"datetime_end"`
	DatetimeStart primitive.DateTime `bson:"datetime_start"`
}

type CalendarEventChangeableFields struct {
	CalendarEvent `bson:"calendar_event,omitempty"`
	TaskType      `bson:"task_type,omitempty"`
	Title         string `bson:"title,omitempty"`
	Body          string `bson:"body,omitempty"`
}

type Email struct {
	ThreadID     string `bson:"thread_id"`
	SenderDomain string `bson:"sender_domain"`
	IsUnread     bool   `bson:"is_unread"`
}

type EmailChangeable struct {
	IsUnread *bool `bson:"is_unread,omitempty"`
}

type MessageChangeable struct {
	EmailChangeable `bson:"email,omitempty"`
	TaskType        *TaskTypeChangeable `bson:"task_type,omitempty"`
	IsCompleted     *bool               `bson:"is_completed,omitempty"`
}

type Task struct {
	PriorityID         string  `bson:"priority_id"`
	PriorityNormalized float64 `bson:"priority_normalized"`
	TaskNumber         int     `bson:"task_number"`
}

type TaskChangeableFields struct {
	Task           `bson:"task,omitempty"`
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

type FeedbackItem struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	UserID    primitive.ObjectID `bson:"user_id"`
	Feedback  string             `bson:"feedback"`
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

type TaskSection struct {
	ID     primitive.ObjectID `bson:"_id,omitempty"`
	UserID primitive.ObjectID `bson:"user_id"`
	Name   string             `bson:"name"`
}

type Pagination struct {
	Limit *int `form:"limit" json:"limit"`
	Page  *int `form:"page" json:"page"`
}

type Recipients struct {
	To  []Recipient `bson:"to"`
	Cc  []Recipient `bson:"cc"`
	Bcc []Recipient `bson:"bcc"`
}

type Recipient struct {
	Name  string `bson:"name"`
	Email string `bson:"email"`
}
