package settings

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type SettingDefinition struct {
	FieldKey      string          `json:"field_key"`
	FieldName     string          `json:"field_name"`
	DefaultChoice string          `json:"-"`
	Choices       []SettingChoice `json:"choices"`
}

type UserSetting struct {
	SettingDefinition
	FieldValue string `json:"field_value"`
}

type SettingChoice struct {
	Key  string `json:"choice_key"`
	Name string `json:"choice_name"`
}

const (
	// Email done
	SettingFieldEmailDonePreference = "email_done_preference"
	ChoiceKeyArchive                = "archive"
	ChoiceKeyMarkAsRead             = "mark_as_read"
	// Email ordering
	SettingFieldEmailOrderingPreference = "email_ordering_preference"
	ChoiceKeyNewestFirst                = "newest_first"
	ChoiceKeyOldestFirst                = "oldest_first"
	// Task duration
	SettingFieldDefaultTaskDuration = "default_task_duration"
	ChoiceKey30Minutes              = "30"
	ChoiceKey60Minutes              = "60"
	ChoiceKey120Minutes             = "120"
)

var Settings = []SettingDefinition{
	{
		FieldKey:      SettingFieldEmailDonePreference,
		FieldName:     "'Done' action for emails",
		DefaultChoice: ChoiceKeyArchive,
		Choices: []SettingChoice{
			{Key: ChoiceKeyArchive, Name: "Archive"},
			{Key: ChoiceKeyMarkAsRead, Name: "Mark as read"},
		},
	},
	{
		FieldKey:      SettingFieldEmailOrderingPreference,
		FieldName:     "Email ordering",
		DefaultChoice: ChoiceKeyNewestFirst,
		Choices: []SettingChoice{
			{Key: ChoiceKeyNewestFirst, Name: "Newest first"},
			{Key: ChoiceKeyOldestFirst, Name: "Oldest first"},
		},
	},
	{
		FieldKey:      SettingFieldDefaultTaskDuration,
		FieldName:     "Default new imported task duration",
		DefaultChoice: ChoiceKey60Minutes,
		Choices: []SettingChoice{
			{Key: ChoiceKey30Minutes, Name: "30 mins"},
			{Key: ChoiceKey60Minutes, Name: "1 hour"},
			{Key: ChoiceKey120Minutes, Name: "2 hours"},
		},
	},
}

func GetUserSetting(db *mongo.Database, userID primitive.ObjectID, fieldKey string) (*string, error) {
	parentCtx := context.Background()
	settingCollection := database.GetUserSettingsCollection(db)
	var userSetting database.UserSetting
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err := settingCollection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"field_key": fieldKey},
		}},
	).Decode(&userSetting)
	if err == nil {
		return &userSetting.FieldValue, nil
	}

	// Default to first choice value
	for _, setting := range Settings {
		if setting.FieldKey == fieldKey {
			return &setting.DefaultChoice, nil
		}
	}
	log.Printf("invalid setting: %s", fieldKey)
	return nil, fmt.Errorf("invalid setting: %s", fieldKey)
}

func UpdateUserSetting(db *mongo.Database, userID primitive.ObjectID, fieldKey string, fieldValue string) error {
	parentCtx := context.Background()
	keyFound := false
	valueFound := false
	for _, setting := range Settings {
		if setting.FieldKey == fieldKey {
			keyFound = true
			for _, choice := range setting.Choices {
				if choice.Key == fieldValue {
					valueFound = true
					break
				}
			}
		}
	}
	if !keyFound {
		return errors.New("invalid setting: " + fieldKey)
	}
	if !valueFound {
		return errors.New("invalid value: " + fieldValue)
	}
	settingCollection := database.GetUserSettingsCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err := settingCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"field_key": fieldKey},
		}},
		bson.M{"$set": &database.UserSetting{
			FieldKey:   fieldKey,
			FieldValue: fieldValue,
			UserID:     userID,
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("failed to update user setting: %v", err)
		return errors.New("internal server error")
	}
	return nil
}
