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

// human readable names aren't defined here because they are not used
var GithubFilteringSetting = SettingDefinition{
	FieldKey:      SettingFieldGithubFilteringPreference,
	DefaultChoice: ChoiceKeyActionableOnly,
	Choices: []SettingChoice{
		{Key: ChoiceKeyActionableOnly},
		{Key: ChoiceKeyAllPRs},
	},
}

var GithubSortingPreferenceSetting = SettingDefinition{
	FieldKey:      SettingFieldGithubSortingPreference,
	DefaultChoice: ChoiceKeyRequiredAction,
	Choices: []SettingChoice{
		{Key: ChoiceKeyRequiredAction},
		{Key: ChoiceKeyPRNumber},
		{Key: ChoiceKeyCreatedAt},
		{Key: ChoiceKeyUpdatedAt},
	},
}

var GithubSortingDirectionSetting = SettingDefinition{
	FieldKey:      SettingFieldGithubSortingDirection,
	DefaultChoice: ChoiceKeyDescending,
	Choices: []SettingChoice{
		{Key: ChoiceKeyDescending},
		{Key: ChoiceKeyAscending},
	},
}

var hardcodedSettings = []SettingDefinition{
	// these settings are for the Github PR page
	GithubFilteringSetting,
	GithubSortingPreferenceSetting,
	GithubSortingDirectionSetting,
}

func GetSettingsOptions(db *mongo.Database, userID primitive.ObjectID) (*[]SettingDefinition, error) {
	settingsOptions := hardcodedSettings

	githubViews, err := getGithubViews(db, userID)
	if err != nil {
		return nil, err
	}

	for _, githubView := range *githubViews {
		settingsOptions = append(
			settingsOptions,
			SettingDefinition{
				FieldKey:      getGithubFieldKey(githubView, SettingFieldGithubFilteringPreference),
				DefaultChoice: GithubFilteringSetting.DefaultChoice,
				Choices:       GithubFilteringSetting.Choices,
			},
			SettingDefinition{
				FieldKey:      getGithubFieldKey(githubView, SettingFieldGithubSortingPreference),
				DefaultChoice: GithubSortingPreferenceSetting.DefaultChoice,
				Choices:       GithubSortingPreferenceSetting.Choices,
			},
			SettingDefinition{
				FieldKey:      getGithubFieldKey(githubView, SettingFieldGithubSortingDirection),
				DefaultChoice: GithubSortingDirectionSetting.DefaultChoice,
				Choices:       GithubSortingDirectionSetting.Choices,
			},
		)
	}

	return &settingsOptions, nil
}

func getGithubViews(db *mongo.Database, userID primitive.ObjectID) (*[]database.View, error) {
	parentCtx := context.Background()

	var views []database.View
	err := database.FindWithCollection(
		parentCtx,
		database.GetViewCollection(db),
		userID,
		&[]bson.M{{"user_id": userID}, {"type": constants.ViewGithub}},
		&views,
	)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to load github views")
		return nil, err
	}
	return &views, nil
}

func getGithubFieldKey(githubView database.View, suffix string) string {
	return githubView.ID.Hex() + "_" + suffix
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

	settingsOptions, err := GetSettingsOptions(db, userID)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to load settings")
		return nil, errors.New("failed to load settings")
	}

	// Default to first choice value
	for _, setting := range *settingsOptions {
		if setting.FieldKey == fieldKey {
			return &setting.DefaultChoice, nil
		}
	}
	logger.Error().Msgf("invalid setting: %s", fieldKey)
	return nil, fmt.Errorf("invalid setting: %s", fieldKey)
}

func UpdateUserSetting(db *mongo.Database, userID primitive.ObjectID, fieldKey string, fieldValue string) error {
	parentCtx := context.Background()
	keyFound := false
	valueFound := false

	settingsOptions, err := GetSettingsOptions(db, userID)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to load settings")
		return errors.New("internal server error")
	}
	for _, setting := range *settingsOptions {
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
	_, err = settingCollection.UpdateOne(
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
		logger.Error().Err(err).Msg("failed to update user setting")
		return errors.New("internal server error")
	}
	return nil
}
