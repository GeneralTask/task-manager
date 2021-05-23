package api

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
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
	SettingFieldEmailDonePreference = "email_done_preference"
	ChoiceKeyArchive                = "archive"
	ChoiceKeyMarkAsRead             = "mark_as_read"
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
}

func (api *API) SettingsList(c *gin.Context) {
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	userID, _ := c.Get("user")
	userSettings := []UserSetting{}
	for _, setting := range Settings {
		userSettings = append(userSettings, UserSetting{
			SettingDefinition: setting,
			FieldValue:        GetUserSetting(db, userID.(primitive.ObjectID), setting.FieldKey),
		})
	}
	c.JSON(200, userSettings)
}

func (api *API) SettingsModify(c *gin.Context) {
	var settingsMap map[string]string
	err := c.BindJSON(&settingsMap)
	if err != nil {
		c.JSON(400, gin.H{"detail": "Parameters missing or malformatted."})
		return
	}
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	userID, _ := c.Get("user")
	for key, value := range settingsMap {
		err = UpdateUserSetting(db, userID.(primitive.ObjectID), key, value)
		if err != nil {
			c.JSON(400, gin.H{"detail": fmt.Sprintf("Failed to update settings: %v", err)})
			return
		}
	}
	c.JSON(200, gin.H{})
}

func GetUserSetting(db *mongo.Database, userID primitive.ObjectID, fieldKey string) string {
	settingCollection := db.Collection("user_settings")
	var userSetting database.UserSetting
	err := settingCollection.FindOne(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"field_key": fieldKey},
		}},
	).Decode(&userSetting)
	if err == nil {
		return userSetting.FieldValue
	}

	log.Printf("Failed to load user setting: %v", err)
	// Default to first choice value
	for _, setting := range Settings {
		if setting.FieldKey == fieldKey {
			return setting.DefaultChoice
		}
	}
	log.Fatalln("Invalid setting:", fieldKey)
	return ""
}

func UpdateUserSetting(db *mongo.Database, userID primitive.ObjectID, fieldKey string, fieldValue string) error {
	keyFound := false
	valueFound := false
	for _, setting := range Settings {
		if setting.FieldKey == fieldKey {
			keyFound = true
			for _, choice := range setting.Choices {
				if choice.Key == fieldValue {
					valueFound = true
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
	settingCollection := db.Collection("user_settings")
	_, err := settingCollection.UpdateOne(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"field_key": fieldKey},
		}},
		bson.D{{Key: "$set", Value: &database.UserSetting{
			FieldKey:   fieldKey,
			FieldValue: fieldValue,
			UserID:     userID,
		}}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Fatalf("Failed to update user setting: %v", err)
	}
	return nil
}
