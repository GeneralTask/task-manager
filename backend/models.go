package main

// APISource is a distinct API with its own token
type APISource string

const (
	// Google APISource
	Google APISource = "google"
)

// User model
type User struct {
	GoogleID string `gorm:"uniqueIndex"`
}

// InternalAPIToken model
type InternalAPIToken struct {
	Token  string `gorm:"uniqueIndex"`
	UserID int
	User   User
}

// ExternalAPIToken model
type ExternalAPIToken struct {
	Token  string
	UserID int
	User   User
	Source string
}
