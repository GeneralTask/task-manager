package main

import (
	"gorm.io/gorm"
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
	ExternalID string
	UserID     int
	User       User
	Source     string
}
