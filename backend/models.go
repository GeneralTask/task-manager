package main

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
	Email 	 string 			`bson:"email,omitempty"`
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
	ID            string 					`json:"id," bson:"_id,omitempty"`
	IDExternal    string 					`json:"id_external" bson:"id_external,omitempty"`
	IDOrdering    int    					`json:"id_ordering" bson:"id_ordering,omitempty"`
	DatetimeEnd   primitive.DateTime 		`json:"datetime_end" bson:"datetime_end,omitempty"`
	DatetimeStart primitive.DateTime 		`json:"datetime_start" bson:"datetime_start,omitempty"`
	Sender        string 					`json:"sender" bson:"sender,omitempty"`
	Source        string 					`json:"source" bson:"source,omitempty"`
	Deeplink	  string 					`json:"link" bson:"link,omitempty"`
	Title         string 					`json:"title" bson:"title,omitempty"`
	Logo		  string 					`json:"logo_url" bson:"logo,omitempty"`
}

type TaskSource struct {
	Name    string
	Logo    string
}

//todo: replace with self-hosted logos: https://app.asana.com/0/1199951001302650/1200025401212320/f
var TaskSourceGoogleCalendar = TaskSource{"gcal", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Google_Calendar_icon.svg/1200px-Google_Calendar_icon.svg.png"}
var TaskSourceGmail = TaskSource{"gmail", "https://1000logos.net/wp-content/uploads/2018/05/Gmail-logo.png"}

type CalendarEvent struct {
	Task `bson:",inline"`
}

type Email struct {
	Task        `bson:",inline"`
	SenderDomain string     			`bson:"sender_email,omitempty"`
	TimeSent    primitive.DateTime    `bson:"time_sent,omitempty"`
}

type JIRATask struct {
	Task      					       `bson:",inline"`
	DueDate    primitive.DateTime      `bson:"due_date,omitempty"`
	Priority   int 			           `bson:"priority,omitempty"`
	TaskNumber int                     `bson:"task_number,omitempty"`
}