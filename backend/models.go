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
	GoogleID string             `gorm:"uniqueIndex"`
}

// InternalAPIToken model
type InternalAPIToken struct {
	ID     primitive.ObjectID `bson:"_id,omitempty"`
	Token  string             `gorm:"uniqueIndex"`
	UserID primitive.ObjectID `bson:"user_id,omitempty"`
}

// ExternalAPIToken model
type ExternalAPIToken struct {
	ID     primitive.ObjectID `bson:"_id,omitempty"`
	Token  string
	UserID primitive.ObjectID `bson:"user_id,omitempty"`
	User   User
	Source string
}
