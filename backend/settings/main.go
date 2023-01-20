package settings

import (
	"context"
	"errors"

	"github.com/GeneralTask/task-manager/backend/external"
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
	// Sidebar settings
	SettingFieldSidebarLinearPreference = "sidebar_linear_preference"
	SettingFieldSidebarJiraPreference   = "sidebar_jira_preference"
	SettingFieldSidebarGithubPreference = "sidebar_github_preference"
	SettingFieldSidebarSlackPreference  = "sidebar_slack_preference"
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
	// Task sorting
	SettingFieldTaskSortingPreference = "task_sorting_preference"
	SettingFieldTaskSortingDirection  = "task_sorting_direction"
	ChoiceKeyManual                   = "manual"
	ChoiceKeyDueDate                  = "due_date"
	ChoiceKeyPriority                 = "priority"
	// Note sorting and filtering
	SettingFieldNoteSortingPreference   = "note_sorting_preference"
	SettingFieldNoteSortingDirection    = "note_sorting_direction"
	SettingFieldNoteFilteringPreference = "note_filtering_preference"
	ChoiceKeyNoDeleted                  = "no_deleted"
	ChoiceKeyShowDeleted                = "show_deleted"
	// Calendar choice
	SettingFieldCalendarForNewTasks = "calendar_account_id_for_new_tasks"
	// Overview page settings
	SettingCollapseEmptyLists     = "collapse_empty_lists"
	SettingMoveEmptyListsToBottom = "move_empty_lists_to_bottom"
	// Lab settings
	LabSmartPrioritizeEnabled = "lab_smart_prioritize_enabled"
)

var SidebarLinearSetting = SettingDefinition{
	FieldKey:      SettingFieldSidebarLinearPreference,
	DefaultChoice: "true",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

var SidebarJiraSetting = SettingDefinition{
	FieldKey:      SettingFieldSidebarJiraPreference,
	DefaultChoice: "true",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

var SidebarGithubSetting = SettingDefinition{
	FieldKey:      SettingFieldSidebarGithubPreference,
	DefaultChoice: "true",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

var SidebarSlackSetting = SettingDefinition{
	FieldKey:      SettingFieldSidebarSlackPreference,
	DefaultChoice: "true",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

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

var TaskSortingPreferenceSetting = SettingDefinition{
	FieldKey:      SettingFieldTaskSortingPreference,
	DefaultChoice: ChoiceKeyManual,
	Choices: []SettingChoice{
		{Key: ChoiceKeyManual},
		{Key: ChoiceKeyDueDate},
		{Key: ChoiceKeyPriority},
		{Key: ChoiceKeyCreatedAt},
		{Key: ChoiceKeyUpdatedAt},
	},
}

var TaskSortingDirectionSetting = SettingDefinition{
	FieldKey:      SettingFieldTaskSortingDirection,
	DefaultChoice: ChoiceKeyDescending,
	Choices: []SettingChoice{
		{Key: ChoiceKeyDescending},
		{Key: ChoiceKeyAscending},
	},
}

var NoteSortingPreferenceSetting = SettingDefinition{
	FieldKey:      SettingFieldNoteSortingPreference,
	DefaultChoice: ChoiceKeyUpdatedAt,
	Choices: []SettingChoice{
		{Key: ChoiceKeyUpdatedAt},
		{Key: ChoiceKeyCreatedAt},
	},
}

var NoteSortingDirectionSetting = SettingDefinition{
	FieldKey:      SettingFieldNoteSortingDirection,
	DefaultChoice: ChoiceKeyDescending,
	Choices: []SettingChoice{
		{Key: ChoiceKeyDescending},
		{Key: ChoiceKeyAscending},
	},
}

var NoteFilteringSetting = SettingDefinition{
	FieldKey:      SettingFieldNoteFilteringPreference,
	DefaultChoice: ChoiceKeyNoDeleted,
	Choices: []SettingChoice{
		{Key: ChoiceKeyNoDeleted},
		{Key: ChoiceKeyShowDeleted},
	},
}

var OverviewCollapseEmptyListsSetting = SettingDefinition{
	FieldKey:      SettingCollapseEmptyLists,
	DefaultChoice: "true",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

var OverviewMoveEmptyListsToBottomSetting = SettingDefinition{
	FieldKey:      SettingMoveEmptyListsToBottom,
	DefaultChoice: "true",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

var LabSmartPrioritizeEnabledSetting = SettingDefinition{
	FieldKey:      LabSmartPrioritizeEnabled,
	DefaultChoice: "false",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

var TaskSectionSettingTypes = []string{"main", "overview"}

var hardcodedSettings = []SettingDefinition{
	// these settings are for the Github PR page
	GithubFilteringSetting,
	GithubSortingPreferenceSetting,
	GithubSortingDirectionSetting,
	// these settings are for the sidebar
	SidebarLinearSetting,
	SidebarJiraSetting,
	SidebarGithubSetting,
	SidebarSlackSetting,
	// these settings are for the notes page
	NoteSortingPreferenceSetting,
	NoteSortingDirectionSetting,
	NoteFilteringSetting,
	OverviewCollapseEmptyListsSetting,
	OverviewMoveEmptyListsToBottomSetting,
	LabSmartPrioritizeEnabledSetting,
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

	taskSections, err := database.GetTaskSections(db, userID)
	if err != nil {
		return nil, err
	}
	*taskSections = append(*taskSections, database.TaskSection{ID: constants.IDTaskSectionDefault})
	for _, taskSection := range *taskSections {
		for _, settingType := range TaskSectionSettingTypes {
			settingsOptions = append(
				settingsOptions,
				SettingDefinition{
					FieldKey:      getTaskSectionFieldKey(taskSection, SettingFieldTaskSortingPreference, settingType),
					DefaultChoice: TaskSortingPreferenceSetting.DefaultChoice,
					Choices:       TaskSortingPreferenceSetting.Choices,
				},
				SettingDefinition{
					FieldKey:      getTaskSectionFieldKey(taskSection, SettingFieldTaskSortingDirection, settingType),
					DefaultChoice: TaskSortingDirectionSetting.DefaultChoice,
					Choices:       TaskSortingDirectionSetting.Choices,
				},
			)
		}
	}

	externalTokens, err := getCalendarTokens(db, userID)
	if err != nil {
		return nil, err
	}
	calendarChoices := []SettingChoice{}
	for _, token := range *externalTokens {
		calendarChoices = append(calendarChoices, SettingChoice{
			Key:  token.AccountID,
			Name: token.DisplayID,
		})
	}
	if len(calendarChoices) > 0 {
		settingsOptions = append(settingsOptions, SettingDefinition{
			FieldKey:      SettingFieldCalendarForNewTasks,
			DefaultChoice: calendarChoices[0].Key,
			Choices:       calendarChoices,
		})
	}

	return &settingsOptions, nil
}

// this helper can't live in the db package because its use of the external package would cause an import cycle
func getCalendarTokens(db *mongo.Database, userID primitive.ObjectID) (*[]database.ExternalAPIToken, error) {
	// in the future, make sure we add other services here with calendars
	return database.GetExternalTokens(db, userID, external.TASK_SERVICE_ID_GOOGLE)
}

func getGithubViews(db *mongo.Database, userID primitive.ObjectID) (*[]database.View, error) {
	var views []database.View
	err := database.FindWithCollection(database.GetViewCollection(db), userID, &[]bson.M{{"user_id": userID}, {"type": constants.ViewGithub}}, &views, nil)
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

func getTaskSectionFieldKey(taskSection database.TaskSection, suffix string, settingType string) string {
	return taskSection.ID.Hex() + "_" + suffix + "_" + settingType
}

func GetUserSettings(db *mongo.Database, userID primitive.ObjectID, settingsOptions *[]SettingDefinition) ([]*UserSetting, error) {
	settingCollection := database.GetUserSettingsCollection(db)
	var userSettings []database.UserSetting
	cursor, err := settingCollection.Find(
		context.Background(),
		bson.M{"user_id": userID},
	)

	logger := logging.GetSentryLogger()

	if err != nil && err != mongo.ErrNoDocuments {
		logger.Error().Msg("unable to fetch settings results")
		return nil, err
	}

	err = cursor.All(context.Background(), &userSettings)
	if err != nil {
		logger.Error().Msg("unable to unmarshal settings results")
		return nil, err
	}

	var settingsResponse []*UserSetting
	for _, setting := range *settingsOptions {
		if setting.Hidden {
			continue
		}
		settingValue := GetSettingValue(userSettings, setting)
		settingsResponse = append(settingsResponse, &UserSetting{
			SettingDefinition: setting,
			FieldValue:        settingValue,
		})
	}

	return settingsResponse, nil
}

func GetSettingValue(settings []database.UserSetting, searchSetting SettingDefinition) string {
	for _, settingValue := range settings {
		if settingValue.FieldKey == searchSetting.FieldKey {
			return settingValue.FieldValue
		}
	}
	return searchSetting.DefaultChoice
}

func UpdateUserSetting(db *mongo.Database, userID primitive.ObjectID, fieldKey string, fieldValue string) error {
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
	_, err = settingCollection.UpdateOne(
		context.Background(),
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
