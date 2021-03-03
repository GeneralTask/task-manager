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
	ID            string `json:"id"`
	IDExternal    string `json:"id_external"`
	IDOrdering    int    `json:"id_ordering"`
	DatetimeEnd   string `json:"datetime_end"`
	DatetimeStart string `json:"datetime_start"`
	Sender        string `json:"sender"`
	Source        string `json:"source"`
	Title         string `json:"title"`
	Logo		  string `json:"logo_url"`
}

type TaskSource struct {
	Name    string `json:"id"`
	Logo    string `json:"id_external"`
}

//need actual logo
var TaskSourceGoogleCalendar = TaskSource{"gcal", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Google_Calendar_icon.svg/1200px-Google_Calendar_icon.svg.png"}