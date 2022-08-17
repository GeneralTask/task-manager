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
	ID             primitive.ObjectID `bson:"_id,omitempty"`
	ServiceID      string             `bson:"service_id"`
	Token          string             `bson:"token"`
	UserID         primitive.ObjectID `bson:"user_id"`
	AccountID      string             `bson:"account_id"`
	DisplayID      string             `bson:"display_id"`
	IsUnlinkable   bool               `bson:"is_unlinkable"`
	IsPrimaryLogin bool               `bson:"is_primary_login"`
	IsBadToken     bool               `bson:"is_bad_token"`
	// For paginated refreshes
	LatestHistoryID         uint64 `bson:"history_id"`
	NextHistoryPageToken    string `bson:"next_history_page"`
	LatestRefreshTimestamp  string `bson:"latest_refresh"`
	CurrentRefreshTimestamp string `bson:"current_refresh"`
	NextRefreshPageToken    string `bson:"next_refresh_page"`
}

type ExternalAPITokenChangeable struct {
	IsBadToken bool `bson:"is_bad_token,omitempty"`
	// For paginated refreshes
	LatestHistoryID         uint64 `bson:"history_id,omitempty"`
	NextHistoryPageToken    string `bson:"next_history_page"`
	LatestRefreshTimestamp  string `bson:"latest_refresh,omitempty"`
	CurrentRefreshTimestamp string `bson:"current_refresh"`
	NextRefreshPageToken    string `bson:"next_refresh_page"`
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
	TaskBase           `bson:",inline"`
	TaskType           `bson:"task_type"`
	Task               `bson:"task,omitempty"`
	SlackMessageParams `bson:"slack_message_params,omitempty"`
}

// Note that this model is used in the request for Slack, and thus should match
// the payload from the Slack request.
type SlackMessageParams struct {
	Channel SlackChannel `json:"channel,omitempty"`
	User    SlackUser    `json:"user,omitempty"`
	Team    SlackTeam    `json:"team,omitempty"`
	Message SlackMessage `json:"message,omitempty"`
}

type SlackTeam struct {
	ID     string `json:"id,omitempty"`
	Domain string `json:"domain,omitempty"`
}

type SlackChannel struct {
	ID   string `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
}

type SlackUser struct {
	ID   string `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
}

type SlackMessage struct {
	Type     string `json:"type,omitempty"`
	User     string `json:"user,omitempty"`
	TimeSent string `json:"ts,omitempty"`
	Text     string `json:"text,omitempty"`
}

type TaskType struct {
	IsTask    bool `bson:"is_task"`
	IsMessage bool `bson:"is_message"`
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
	SourceID         string             `bson:"source_id"`
	SourceAccountID  string             `bson:"source_account_id"`
	Deeplink         string             `bson:"deeplink"`
	Title            string             `bson:"title"`
	Body             string             `bson:"body"`
	HasBeenReordered bool               `bson:"has_been_reordered"`
	DueDate          primitive.DateTime `bson:"due_date"`
	//time in nanoseconds
	TimeAllocation    int64              `bson:"time_allocated"`
	CreatedAtExternal primitive.DateTime `bson:"created_at_external"`
	CompletedAt       primitive.DateTime `bson:"completed_at"`
}

type PullRequest struct {
	ID                primitive.ObjectID `bson:"_id,omitempty"`
	UserID            primitive.ObjectID `bson:"user_id,omitempty"`
	IDExternal        string             `bson:"id_external,omitempty"`
	IDOrdering        int                `bson:"id_ordering,omitempty"`
	SourceID          string             `bson:"source_id,omitempty"`
	SourceAccountID   string             `bson:"source_account_id,omitempty"`
	Deeplink          string             `bson:"deeplink,omitempty"`
	Title             string             `bson:"title,omitempty"`
	Body              string             `bson:"body,omitempty"`
	RepositoryID      string             `bson:"repository_id,omitempty"`
	RepositoryName    string             `bson:"repository_name,omitempty"`
	Number            int                `bson:"number,omitempty"`
	Author            string             `bson:"author,omitempty"`
	Branch            string             `bson:"branch,omitempty"`
	RequiredAction    string             `bson:"required_action,omitempty"`
	CommentCount      int                `bson:"comment_count,omitempty"`
	CreatedAtExternal primitive.DateTime `bson:"created_at_external,omitempty"`
	LastUpdatedAt     primitive.DateTime `bson:"last_updated_at,omitempty"`
	CompletedAt       primitive.DateTime `bson:"completed_at,omitempty"`
}

type CalendarEvent struct {
	ID              primitive.ObjectID `bson:"_id,omitempty"`
	UserID          primitive.ObjectID `bson:"user_id,omitempty"`
	IDExternal      string             `bson:"id_external,omitempty"`
	SourceID        string             `bson:"source_id,omitempty"`
	SourceAccountID string             `bson:"source_account_id,omitempty"`
	Deeplink        string             `bson:"deeplink,omitempty"`
	Title           string             `bson:"title,omitempty"`
	Body            string             `bson:"body,omitempty"`
	DatetimeEnd     primitive.DateTime `bson:"datetime_end,omitempty"`
	DatetimeStart   primitive.DateTime `bson:"datetime_start,omitempty"`
	//time in nanoseconds
	TimeAllocation int64  `bson:"time_allocated"`
	CallLogo       string `bson:"call_logo,omitempty"`
	CallPlatform   string `bson:"call_platform,omitempty"`
	CallURL        string `bson:"call_url,omitempty"`
}

type MessageChangeable struct {
	TaskType    *TaskTypeChangeable `bson:"task_type,omitempty"`
	IsCompleted *bool               `bson:"is_completed,omitempty"`
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
	PriorityID         string             `bson:"priority_id"`
	PriorityNormalized float64            `bson:"priority_normalized"`
	TaskNumber         int                `bson:"task_number"`
	Comments           *[]Comment         `bson:"comments"`
	Status             ExternalTaskStatus `bson:"status"`
	// Used to cache the current status before marking the task as done
	PreviousStatus  ExternalTaskStatus `bson:"previous_status"`
	CompletedStatus ExternalTaskStatus `bson:"completed_status"`
}

type TaskChangeable struct {
	PriorityID         *string             `bson:"priority_id,omitempty"`
	PriorityNormalized *float64            `bson:"priority_normalized,omitempty"`
	TaskNumber         *int                `bson:"task_number,omitempty"`
	Comments           *[]Comment          `bson:"comments,omitempty"`
	Status             *ExternalTaskStatus `bson:"status,omitempty"`
	// Used to cache the current status before marking the task as done
	PreviousStatus  *ExternalTaskStatus `bson:"previous_status,omitempty"`
	CompletedStatus *ExternalTaskStatus `bson:"completed_status,omitempty"`
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

type View struct {
	ID            primitive.ObjectID `bson:"_id,omitempty"`
	UserID        primitive.ObjectID `bson:"user_id"`
	IDOrdering    int                `bson:"id_ordering"`
	Type          string             `bson:"type"`
	IsReorderable bool               `bson:"is_reorderable"`
	IsLinked      bool               `bson:"is_linked"`
	GithubID      string             `bson:"github_id"`
	TaskSectionID primitive.ObjectID `bson:"task_section_id"`
}
