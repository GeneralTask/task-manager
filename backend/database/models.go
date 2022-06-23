package database

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// https://www.mongodb.com/blog/post/quick-start-golang--mongodb--modeling-documents-with-go-data-structures

// User model
type User struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty"`
	GoogleID           string             `bson:"google_id"`
	Email              string             `bson:"email"`
	Name               string             `bson:"name"`
	LastRefreshed      primitive.DateTime `bson:"last_refreshed,omitempty"`
	AgreedToTerms      *bool              `bson:"agreed_to_terms,omitempty"`
	OptedIntoMarketing *bool              `bson:"opted_into_marketing,omitempty"`
	CreatedAt          primitive.DateTime `bson:"created_at,omitempty"`
}

type UserChangeable struct {
	Email         string             `bson:"email,omitempty"`
	Name          string             `bson:"name,omitempty"`
	LastRefreshed primitive.DateTime `bson:"last_refreshed,omitempty"`
}

// InternalAPIToken model
type InternalAPIToken struct {
	ID     primitive.ObjectID `bson:"_id,omitempty"`
	Token  string             `bson:"token"`
	UserID primitive.ObjectID `bson:"user_id"`
}

// ExternalAPIToken model
type ExternalAPIToken struct {
	ID              primitive.ObjectID `bson:"_id,omitempty"`
	ServiceID       string             `bson:"service_id"`
	Token           string             `bson:"token"`
	UserID          primitive.ObjectID `bson:"user_id"`
	AccountID       string             `bson:"account_id"`
	DisplayID       string             `bson:"display_id"`
	LatestHistoryID uint64             `bson:"history_id"`
	IsUnlinkable    bool               `bson:"is_unlinkable"`
	IsPrimaryLogin  bool               `bson:"is_primary_login"`
	IsBadToken      bool               `bson:"is_bad_token"`
}

type ExternalAPITokenChangeable struct {
	IsBadToken      bool   `bson:"is_bad_token,omitempty"`
	LatestHistoryID uint64 `bson:"history_id,omitempty"`
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
	EmailThread   `bson:"email_thread,omitempty"`
	CalendarEvent `bson:"calendar_event,omitempty"`
	PullRequest   `bson:"pull_request,omitempty"`
}

type TaskType struct {
	IsTask        bool `bson:"is_task"`
	IsMessage     bool `bson:"is_message"`
	IsThread      bool `bson:"is_thread"`
	IsEvent       bool `bson:"is_event"`
	IsPullRequest bool `bson:"is_pull_request"`
}

type TaskTypeChangeable struct {
	IsTask        *bool `bson:"is_task,omitempty"`
	IsMessage     *bool `bson:"is_message,omitempty"`
	IsThread      *bool `bson:"is_thread,omitempty"`
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
	//slack
	Channel  string `json:"channel"`
	SenderID string `json:"sender_id"`
	Team     string `json:"team"`
	TimeSent string `json:"ts"`
}

type PullRequest struct {
	Opened primitive.DateTime `bson:"opened"`
}

type PullRequestChangeableFields struct {
	Title       string `bson:"title,omitempty"`
	Body        string `bson:"body,omitempty"`
	IsCompleted *bool  `bson:"is_completed,omitempty"`
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

type EmailThread struct {
	ThreadID      string             `bson:"thread_id" json:"thread_id"`
	LastUpdatedAt primitive.DateTime `bson:"last_updated_at" json:"last_updated_at"`
	Emails        []Email            `bson:"emails,omitempty" json:"emails,omitempty"`
	IsArchived    bool               `bson:"is_archived" json:"is_archived"`
}

type Email struct {
	MessageID      primitive.ObjectID `bson:"message_id" json:"message_id"`
	SMTPID         string             `bson:"smtp_id" json:"smtp_id"`
	ThreadID       string             `bson:"thread_id" json:"thread_id"`
	EmailID        string             `bson:"email_id" json:"email_id"`
	Subject        string             `bson:"subject" json:"subject"`
	Body           string             `bson:"body" json:"body"`
	SenderDomain   string             `bson:"sender_domain" json:"sender_domain"`
	SenderEmail    string             `bson:"sender_email" json:"sender_email"`
	SenderName     string             `bson:"sender_name" json:"sender_name"`
	ReplyTo        string             `bson:"reply_to" json:"reply_to"`
	IsUnread       bool               `bson:"is_unread" json:"is_unread"`
	Recipients     Recipients         `bson:"recipients" json:"recipients"`
	SentAt         primitive.DateTime `bson:"sent_at" json:"sent_at"`
	NumAttachments int                `bson:"num_attachments" json:"num_attachments"`
}

type EmailChangeable struct {
	IsUnread *bool `bson:"is_unread,omitempty"`
}

type MessageChangeable struct {
	EmailChangeable `bson:"email,omitempty"`
	TaskType        *TaskTypeChangeable `bson:"task_type,omitempty"`
	IsCompleted     *bool               `bson:"is_completed,omitempty"`
}

type LinkedMessage struct {
	ThreadID *primitive.ObjectID `bson:"thread_id"`
	EmailID  *primitive.ObjectID `bson:"email_id"`
}

type ExternalUser struct {
	ExternalID  string `bson:"external_id"`
	Name        string `bson:"name"`
	DisplayName string `bson:"display_name"`
	Email       string `bson:"email"`
}

type Comment struct {
	Body      string             `bson:"body" json:"body"`
	User      ExternalUser       `bson:"user" json:"user"`
	CreatedAt primitive.DateTime `bson:"created_at" json:"created_at"`
}

type ExternalTaskStatus struct {
	ExternalID string `bson:"external_id"`
	State      string `bson:"state"`
	Type       string `bson:"type"`
}

type Task struct {
	PriorityID         string  `bson:"priority_id"`
	PriorityNormalized float64 `bson:"priority_normalized"`
	TaskNumber         int     `bson:"task_number"`
	LinkedMessage      `bson:"linked_message"`
	Comments           *[]Comment         `bson:"comments"`
	Status             ExternalTaskStatus `bson:"status"`
	// Used to cache the current status before marking the task as done
	PreviousStatus  ExternalTaskStatus `bson:"previous_status"`
	CompletedStatus ExternalTaskStatus `bson:"completed_status"`
}

type TaskChangeable struct {
	PriorityID         *string  `bson:"priority_id,omitempty"`
	PriorityNormalized *float64 `bson:"priority_normalized,omitempty"`
	TaskNumber         *int     `bson:"task_number,omitempty"`
	LinkedMessage      `bson:"linked_message,omitempty"`
	Comments           *[]Comment          `bson:"comments,omitempty"`
	Status             *ExternalTaskStatus `bson:"status,omitempty"`
	// Used to cache the current status before marking the task as done
	PreviousStatus  *ExternalTaskStatus `bson:"previous_status,omitempty"`
	CompletedStatus *ExternalTaskStatus `bson:"completed_status,omitempty"`
}

type TaskItemChangeableFields struct {
	Task           *TaskChangeable    `bson:"task,omitempty"`
	Title          *string            `json:"title" bson:"title,omitempty"`
	Body           *string            `json:"body" bson:"body,omitempty"`
	DueDate        primitive.DateTime `json:"due_date" bson:"due_date,omitempty"`
	TimeAllocation *int64             `json:"time_duration" bson:"time_allocated,omitempty"`
	IsCompleted    *bool              `json:"is_completed" bson:"is_completed,omitempty"`
	CompletedAt    primitive.DateTime `json:"completed_at" bson:"completed_at"`
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
	To  []Recipient `bson:"to" json:"to"`
	Cc  []Recipient `bson:"cc" json:"cc"`
	Bcc []Recipient `bson:"bcc" json:"bcc"`
}

type Recipient struct {
	Name  string `bson:"name" json:"name"`
	Email string `bson:"email" json:"email"`
}

type EmailItemChangeable struct {
	Email `bson:"email,omitempty"`
}

type EmailThreadChangeable struct {
	ThreadID      string             `bson:"thread_id,omitempty"`
	LastUpdatedAt primitive.DateTime `bson:"last_updated_at,omitempty"`
	Emails        []Email            `bson:"emails,omitempty"`
	IsArchived    *bool              `bson:"is_archived,omitempty"`
}

type ThreadItemChangeable struct {
	EmailThreadChangeable `bson:"email_thread,omitempty"`
	TaskTypeChangeable    *TaskTypeChangeable `bson:"task_type,omitempty"`
}
