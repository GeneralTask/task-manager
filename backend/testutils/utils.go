package testutils

import "time"

func CreateTimestamp(dt string) *time.Time {
	createdAt, _ := time.Parse("2006-01-02", dt)
	return &createdAt
}
