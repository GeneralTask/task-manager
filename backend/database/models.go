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

type Task struct {
	ID     primitive.ObjectID `bson:"_id,omitempty"`
	UserID primitive.ObjectID `bson:"user_id,omitempty"`
	// required for sub-task experience
	ParentTaskID *string   `bson:"parent_task_id,omitempty"`
	SubTaskIDs   *[]string `bson:"sub_task_ids,omitempty"`
	// generic task values (for all sources)
	IDExternal         string              `bson:"id_external,omitempty"`
	IDOrdering         int                 `bson:"id_ordering,omitempty"`
	IDTaskSection      primitive.ObjectID  `bson:"id_task_section,omitempty"`
	IsCompleted        *bool               `bson:"is_completed,omitempty"`
	Sender             string              `bson:"sender,omitempty"`
	SourceID           string              `bson:"source_id,omitempty"`
	SourceAccountID    string              `bson:"source_account_id,omitempty"`
	Deeplink           string              `bson:"deeplink,omitempty"`
	Title              *string             `bson:"title,omitempty"`
	Body               *string             `bson:"body,omitempty"`
	HasBeenReordered   bool                `bson:"has_been_reordered,omitempty"`
	DueDate            *primitive.DateTime `bson:"due_date,omitempty"`
	TimeAllocation     *int64              `bson:"time_allocated,omitempty"` // time in nanoseconds
	CreatedAtExternal  primitive.DateTime  `bson:"created_at_external,omitempty"`
	CompletedAt        primitive.DateTime  `bson:"completed_at,omitempty"`
	PriorityID         *string             `bson:"priority_id,omitempty"`
	PriorityNormalized *float64            `bson:"priority_normalized,omitempty"`
	TaskNumber         *int                `bson:"task_number,omitempty"`
	Comments           *[]Comment          `bson:"comments,omitempty"`
	// used to cache the current status before marking the task as done
	Status          *ExternalTaskStatus `bson:"status,omitempty"`
	PreviousStatus  *ExternalTaskStatus `bson:"previous_status,omitempty"`
	CompletedStatus *ExternalTaskStatus `bson:"completed_status,omitempty"`
	// info required for Slack integration
	SlackMessageParams SlackMessageParams `bson:"slack_message_params,omitempty"`
	// meeting prep fields
	MeetingPreparationParams MeetingPreparationParams `bson:"meeting_preparation_params,omitempty"`
	IsMeetingPreparationTask bool                     `bson:"is_meeting_preparation_task,omitempty"`
}

type PullRequest struct {
	ID                primitive.ObjectID   `bson:"_id,omitempty"`
	UserID            primitive.ObjectID   `bson:"user_id,omitempty"`
	IDExternal        string               `bson:"id_external,omitempty"`
	IDOrdering        int                  `bson:"id_ordering,omitempty"`
	IsCompleted       *bool                `bson:"is_completed,omitempty"`
	SourceID          string               `bson:"source_id,omitempty"`
	SourceAccountID   string               `bson:"source_account_id,omitempty"`
	Deeplink          string               `bson:"deeplink,omitempty"`
	Title             string               `bson:"title,omitempty"`
	Body              string               `bson:"body,omitempty"`
	RepositoryID      string               `bson:"repository_id,omitempty"`
	RepositoryName    string               `bson:"repository_name,omitempty"`
	Number            int                  `bson:"number,omitempty"`
	Author            string               `bson:"author,omitempty"`
	Branch            string               `bson:"branch,omitempty"`
	RequiredAction    string               `bson:"required_action,omitempty"`
	Comments          []PullRequestComment `bson:"comments,omitempty"`
	CommentCount      int                  `bson:"comment_count,omitempty"`
	CreatedAtExternal primitive.DateTime   `bson:"created_at_external,omitempty"`
	LastFetched       primitive.DateTime   `bson:"last_fetched,omitempty"`
	LastUpdatedAt     primitive.DateTime   `bson:"last_updated_at,omitempty"`
	CompletedAt       primitive.DateTime   `bson:"completed_at,omitempty"`
}

type PullRequestComment struct {
	Type            string             `bson:"type,omitempty"`
	Body            string             `bson:"body,omitempty"`
	Author          string             `bson:"author,omitempty"`
	Filepath        string             `bson:"filepath,omitempty"`
	LineNumberStart int                `bson:"line_number_start,omitempty"`
	LineNumberEnd   int                `bson:"line_number_end,omitempty"`
	CreatedAt       primitive.DateTime `bson:"last_updated_at,omitempty"`
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
	TimeAllocation     int64              `bson:"time_allocated"`
	CallLogo           string             `bson:"call_logo,omitempty"`
	CallPlatform       string             `bson:"call_platform,omitempty"`
	CallURL            string             `bson:"call_url,omitempty"`
	CanModify          bool               `bson:"can_modify,omitempty"`
	LinkedTaskID       primitive.ObjectID `bson:"linked_task_id,omitempty"`
	LinkedTaskSourceID string             `bson:"linked_task_source_id,omitempty"`
}

type MeetingPreparationParams struct {
	CalendarEventID               primitive.ObjectID `bson:"event_id"`
	IDExternal                    string             `bson:"id_external"`
	DatetimeStart                 primitive.DateTime `bson:"datetime_start"`
	DatetimeEnd                   primitive.DateTime `bson:"datetime_end"`
	HasBeenAutomaticallyCompleted bool               `bson:"has_been_automatically_completed"`
}

// Note that this model is used in the request for Slack, and thus should match
// the payload from the Slack request.
type SlackMessageParams struct {
	Channel     SlackChannel `bson:"channel,omitempty" json:"channel,omitempty"`
	User        SlackUser    `bson:"user,omitempty" json:"user,omitempty"`
	Team        SlackTeam    `bson:"team,omitempty" json:"team,omitempty"`
	Message     SlackMessage `bson:"message,omitempty" json:"message,omitempty"`
	ResponseURL string       `bson:"response_url,omitempty" json:"response_url,omitempty"`
}

type SlackTeam struct {
	ID     string `bson:"id,omitempty" json:"id,omitempty"`
	Domain string `bson:"domain,omitempty" json:"domain,omitempty"`
}

type SlackChannel struct {
	ID   string `bson:"id,omitempty" json:"id,omitempty"`
	Name string `bson:"name,omitempty" json:"name,omitempty"`
}

type SlackUser struct {
	ID   string `bson:"id,omitempty" json:"id,omitempty"`
	Name string `bson:"name,omitempty" json:"name,omitempty"`
}

type SlackMessage struct {
	Type     string `bson:"type,omitempty" json:"type,omitempty"`
	User     string `bson:"user,omitempty" json:"user,omitempty"`
	TimeSent string `bson:"ts,omitempty" json:"ts,omitempty"`
	Text     string `bson:"text,omitempty" json:"text,omitempty"`
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

type Repository struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"`
	UserID       primitive.ObjectID `bson:"user_id"`
	FullName     string             `bson:"full_name"`
	RepositoryID string             `bson:"repository_id"`
	Deeplink     string             `bson:"deeplink"`
}

type DefaultSectionSettings struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"`
	UserID       primitive.ObjectID `bson:"user_id"`
	NameOverride string             `bson:"name_override"`
}
