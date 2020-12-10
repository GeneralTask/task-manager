package main

import (
	"gorm.io/gorm"
)

// APISource is a distinct API with its own token
type APISource string

const (
	// Google APISource
	Google APISource = "google"
)

// User model
type User struct {
	gorm.Model
}

// InternalAPIToken model
type InternalAPIToken struct {
	gorm.Model
	Token  string `gorm:"uniqueIndex"`
	UserID int
	User   User
}

// ExternalAPIToken model
type ExternalAPIToken struct {
	gorm.Model
	Token  string
	UserID int
	User   User
	Source string
}
