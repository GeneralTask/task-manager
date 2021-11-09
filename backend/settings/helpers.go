package settings

import (
	"log"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetDefaultTaskDuration(db *mongo.Database, userID primitive.ObjectID) int64 {
	result, err := GetUserSetting(db, userID, SettingFieldDefaultTaskDuration)
	if err != nil {
		log.Printf("failed to fetch user setting: %v", err)
		return time.Hour.Nanoseconds()
	}
	durationMinutes, err := strconv.Atoi(*result)
	if err != nil {
		log.Printf("failed to parse user setting: %v", err)
		return time.Hour.Nanoseconds()
	}
	return (time.Duration(durationMinutes) * time.Minute).Nanoseconds()
}
