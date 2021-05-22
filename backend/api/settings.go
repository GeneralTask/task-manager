package api

import (
	"context"
	"log"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type SettingDefinition struct {
	FieldKey  string          `json:"field_key"`
	FieldName string          `json:"field_name"`
	Choices   []SettingChoice `json:"choices"`
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
		FieldKey:  SettingFieldEmailDonePreference,
		FieldName: "'Done' action for emails",
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
	for _, setting := range Settings {
		if setting.FieldKey == fieldKey {
			return setting.Choices[0].Key
		}
	}
	log.Fatalln("Invalid setting:", fieldKey)
	return ""
}
