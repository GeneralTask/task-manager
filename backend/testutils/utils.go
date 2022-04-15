package testutils

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

func CreateTimestamp(dt string) *time.Time {
	createdAt, _ := time.Parse("2006-01-02", dt)
	return &createdAt
}
func CreateDateTime(dt string) *primitive.DateTime {
	res := primitive.NewDateTimeFromTime(*CreateTimestamp(dt))
	return &res
}
