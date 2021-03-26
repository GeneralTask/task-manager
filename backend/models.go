package main

import "go.mongodb.org/mongo-driver/bson/primitive"

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

// Task json model
type Task struct {
	ID                string             `json:"id"`
	IDExternal        string             `json:"id_external"`
	IDOrdering        int                `json:"id_ordering"`
	CreatedAtExternal string             `json:"created_at_external"`
	DatetimeEnd       primitive.DateTime `json:"datetime_end"`
	DatetimeStart     primitive.DateTime `json:"datetime_start"`
	DueDate           primitive.DateTime `json:"due_date"`
	PriorityExternal  int                `json:"priority_external"`
	SenderName        string             `json:"sender_name"`
	SenderEmail       string             `json:"sender_email"`
	Source            string             `json:"source"`
	Deeplink          string             `json:"link"`
	Title             string             `json:"title"`
	Logo              string             `json:"logo_url"`
}

type TaskSource struct {
	Name string
	Logo string
}

//todo: replace with self-hosted logos: https://app.asana.com/0/1199951001302650/1200025401212320/f
var TaskSourceGoogleCalendar = TaskSource{"gcal", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Google_Calendar_icon.svg/1200px-Google_Calendar_icon.svg.png"}
var TaskSourceGmail = TaskSource{"gmail", "https://1000logos.net/wp-content/uploads/2018/05/Gmail-logo.png"}
var TaskSourceJIRA = TaskSource{"jira", "https://zulipchat.com/static/images/integrations/logos/jira.svg"}
