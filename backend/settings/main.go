package settings

import (
	"context"
	"errors"
	"fmt"

	"github.com/GeneralTask/task-manager/backend/logging"

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
	Hidden        bool            `json:"-"`
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
	// Github PR filtering
	SettingFieldGithubFilteringPreference = "github_filtering_preference"
	ChoiceKeyAllPRs                       = "all_prs"
	ChoiceKeyActionableOnly               = "actionable_only"
	// Github PR sorting
	SettingFieldGithubSortingPreference = "github_sorting_preference"
	ChoiceKeyRequiredAction             = "required_action"
	ChoiceKeyPRNumber                   = "pr_number"
	ChoiceKeyCreatedAt                  = "created_at"
	ChoiceKeyUpdatedAt                  = "updated_at"
	// Github PR sorting direction
	SettingFieldGithubSortingDirection = "github_sorting_direction"
	ChoiceKeyDescending                = "descending"
	ChoiceKeyAscending                 = "ascending"
)

var Settings = []SettingDefinition{
	{
		FieldKey:      SettingFieldGithubFilteringPreference,
		FieldName:     "Github PR filtering preference for PR page",
		DefaultChoice: ChoiceKeyActionableOnly,
		Choices: []SettingChoice{
			{Key: ChoiceKeyActionableOnly, Name: "Actionable Only"},
			{Key: ChoiceKeyAllPRs, Name: "All PRs"},
		},
		Hidden: false,
	},
	{
		FieldKey:      SettingFieldGithubSortingPreference,
		FieldName:     "Github PR sorting preference for PR page",
		DefaultChoice: ChoiceKeyRequiredAction,
		Choices: []SettingChoice{
			{Key: ChoiceKeyRequiredAction, Name: "Required Action"},
			{Key: ChoiceKeyPRNumber, Name: "PR Number"},
			{Key: ChoiceKeyCreatedAt, Name: "Created At"},
			{Key: ChoiceKeyUpdatedAt, Name: "Updated At"},
		},
		Hidden: false,
	},
	{
		FieldKey:      SettingFieldGithubSortingDirection,
		FieldName:     "Github PR sorting direction preference for PR page",
		DefaultChoice: ChoiceKeyDescending,
		Choices: []SettingChoice{
			{Key: ChoiceKeyDescending, Name: "Descending"},
			{Key: ChoiceKeyAscending, Name: "Ascending"},
		},
		Hidden: false,
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
	logger := logging.GetSentryLogger()
	logger.Error().Msgf("invalid setting: %s", fieldKey)
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
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to update user setting")
		return errors.New("internal server error")
	}
	return nil
}
