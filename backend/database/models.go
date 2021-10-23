package database

import (
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// https://www.mongodb.com/blog/post/quick-start-golang--mongodb--modeling-documents-with-go-data-structures

// User model
type User struct {
	History  History            `bson:"history"`
	ID       primitive.ObjectID `bson:"_id,omitempty"`
	GoogleID string             `bson:"google_id"`
	Email    string             `bson:"email"`
	Name     string             `bson:"name"`
}

// InternalAPIToken model
type InternalAPIToken struct {
	History History            `bson:"history"`
	ID      primitive.ObjectID `bson:"_id,omitempty"`
	Token   string             `bson:"token"`
	UserID  primitive.ObjectID `bson:"user_id"`
}

// ExternalAPIToken model
type ExternalAPIToken struct {
	History        History            `bson:"history"`
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
	History History            `bson:"history"`
	ID      primitive.ObjectID `bson:"_id,omitempty"`
	UserID  primitive.ObjectID `bson:"user_id"`
	CloudID string             `bson:"cloud_id"`
	SiteURL string             `bson:"site_url"`
}

type JIRAPriority struct {
	History         History            `bson:"history"`
	ID              primitive.ObjectID `bson:"_id,omitempty"`
	UserID          primitive.ObjectID `bson:"user_id"`
	JIRAID          string             `bson:"jira_id"`
	IntegerPriority int                `bson:"integer_priority"`
}

type StateToken struct {
	History History            `bson:"history"`
	Token   primitive.ObjectID `bson:"_id,omitempty"`
	UserID  primitive.ObjectID `bson:"user_id"`
}

type Oauth1RequestSecret struct {
	History       History            `bson:"history"`
	ID            primitive.ObjectID `bson:"_id,omitempty"`
	UserID        primitive.ObjectID `bson:"user_id"`
	RequestSecret string             `bson:"request_secret"`
}

// Task json & mongo model
type TaskBase struct {
	History          History            `bson:"history"`
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
	//time in nanoseconds
	TimeAllocation int64 `bson:"time_allocated"`
}

type CalendarEvent struct {
	TaskBase      `bson:",inline"`
	DatetimeEnd   primitive.DateTime `bson:"datetime_end"`
	DatetimeStart primitive.DateTime `bson:"datetime_start"`
}

type CalendarEventChangeableFields struct {
	History       HistoryUpdateOnly  `bson:"history"`
	Title         string             `bson:"title,omitempty"`
	DatetimeEnd   primitive.DateTime `bson:"datetime_end,omitempty"`
	DatetimeStart primitive.DateTime `bson:"datetime_start,omitempty"`
}

type Email struct {
	TaskBase     `bson:",inline"`
	ThreadID     string             `bson:"thread_id"`
	SenderDomain string             `bson:"sender_domain"`
	TimeSent     primitive.DateTime `bson:"time_sent"`
}

type Task struct {
	TaskBase           `bson:",inline"`
	DueDate            primitive.DateTime `bson:"due_date"`
	PriorityID         string             `bson:"priority_id"`
	PriorityNormalized float64            `bson:"priority_normalized"`
	TaskNumber         int                `bson:"task_number"`
}

type TaskChangeableFields struct {
	History            HistoryUpdateOnly  `bson:"history"`
	Title              string             `json:"title" bson:"title,omitempty"`
	DueDate            primitive.DateTime `bson:"due_date,omitempty"`
	PriorityID         string             `bson:"priority_id,omitempty"`
	PriorityNormalized float64            `bson:"priority_normalized,omitempty"`
}

type UserSetting struct {
	History    History            `bson:"history"`
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

type History struct {
	CreatedAt primitive.DateTime `bson:"created_at"`
	UpdatedAt primitive.DateTime `bson:"updated_at"`
}

type historyMirror struct {
	CreatedAt primitive.DateTime `bson:"created_at"`
	UpdatedAt primitive.DateTime `bson:"updated_at"`
}

func (history *History) MarshalBSON() ([]byte, error) {
	if history.CreatedAt == primitive.DateTime(0) {
		history.CreatedAt = primitive.NewDateTimeFromTime(time.Now())
	}
	history.UpdatedAt = primitive.NewDateTimeFromTime(time.Now())

	return bson.Marshal(historyMirror{CreatedAt: history.CreatedAt, UpdatedAt: history.UpdatedAt})
}

type HistoryUpdateOnly struct {
	UpdatedAt primitive.DateTime `bson:"updated_at"`
}

type historyUpdateOnlyMirror struct {
	UpdatedAt primitive.DateTime `bson:"updated_at"`
}

func (history *HistoryUpdateOnly) MarshalBSON() ([]byte, error) {
	log.Println("marshal bson!")
	history.UpdatedAt = primitive.NewDateTimeFromTime(time.Now())
	return bson.Marshal(historyUpdateOnlyMirror{UpdatedAt: history.UpdatedAt})
}
