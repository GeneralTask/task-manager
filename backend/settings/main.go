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

var SidebarLinearSetting = SettingDefinition{
	FieldKey:      constants.SettingFieldSidebarLinearPreference,
	DefaultChoice: "true",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

var SidebarJiraSetting = SettingDefinition{
	FieldKey:      constants.SettingFieldSidebarJiraPreference,
	DefaultChoice: "true",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

var SidebarGithubSetting = SettingDefinition{
	FieldKey:      constants.SettingFieldSidebarGithubPreference,
	DefaultChoice: "true",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

var SidebarSlackSetting = SettingDefinition{
	FieldKey:      constants.SettingFieldSidebarSlackPreference,
	DefaultChoice: "true",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

// human readable names aren't defined here because they are not used
var GithubFilteringSetting = SettingDefinition{
	FieldKey:      constants.SettingFieldGithubFilteringPreference,
	DefaultChoice: constants.ChoiceKeyActionableOnly,
	Choices: []SettingChoice{
		{Key: constants.ChoiceKeyActionableOnly},
		{Key: constants.ChoiceKeyAllPRs},
	},
}

var GithubSortingPreferenceSetting = SettingDefinition{
	FieldKey:      constants.SettingFieldGithubSortingPreference,
	DefaultChoice: constants.ChoiceKeyRequiredAction,
	Choices: []SettingChoice{
		{Key: constants.ChoiceKeyRequiredAction},
		{Key: constants.ChoiceKeyPRNumber},
		{Key: constants.ChoiceKeyCreatedAt},
		{Key: constants.ChoiceKeyUpdatedAt},
	},
}

var GithubSortingDirectionSetting = SettingDefinition{
	FieldKey:      constants.SettingFieldGithubSortingDirection,
	DefaultChoice: constants.ChoiceKeyDescending,
	Choices: []SettingChoice{
		{Key: constants.ChoiceKeyDescending},
		{Key: constants.ChoiceKeyAscending},
	},
}

var TaskSortingPreferenceSetting = SettingDefinition{
	FieldKey:      constants.SettingFieldTaskSortingPreference,
	DefaultChoice: constants.ChoiceKeyManual,
	Choices: []SettingChoice{
		{Key: constants.ChoiceKeyManual},
		{Key: constants.ChoiceKeyDueDate},
		{Key: constants.ChoiceKeyPriority},
		{Key: constants.ChoiceKeyCreatedAt},
		{Key: constants.ChoiceKeyUpdatedAt},
	},
}

var TaskSortingDirectionSetting = SettingDefinition{
	FieldKey:      constants.SettingFieldTaskSortingDirection,
	DefaultChoice: constants.ChoiceKeyDescending,
	Choices: []SettingChoice{
		{Key: constants.ChoiceKeyDescending},
		{Key: constants.ChoiceKeyAscending},
	},
}

var NoteSortingPreferenceSetting = SettingDefinition{
	FieldKey:      constants.SettingFieldNoteSortingPreference,
	DefaultChoice: constants.ChoiceKeyUpdatedAt,
	Choices: []SettingChoice{
		{Key: constants.ChoiceKeyUpdatedAt},
		{Key: constants.ChoiceKeyCreatedAt},
	},
}

var NoteSortingDirectionSetting = SettingDefinition{
	FieldKey:      constants.SettingFieldNoteSortingDirection,
	DefaultChoice: constants.ChoiceKeyDescending,
	Choices: []SettingChoice{
		{Key: constants.ChoiceKeyDescending},
		{Key: constants.ChoiceKeyAscending},
	},
}

var NoteFilteringSetting = SettingDefinition{
	FieldKey:      constants.SettingFieldNoteFilteringPreference,
	DefaultChoice: constants.ChoiceKeyNoDeleted,
	Choices: []SettingChoice{
		{Key: constants.ChoiceKeyNoDeleted},
		{Key: constants.ChoiceKeyShowDeleted},
	},
}

var RecurringTaskFilteringSetting = SettingDefinition{
	FieldKey:      constants.SettingFieldRecurringTaskFilteringPreference,
	DefaultChoice: constants.ChoiceKeyNoDeleted,
	Choices: []SettingChoice{
		{Key: constants.ChoiceKeyNoDeleted},
		{Key: constants.ChoiceKeyShowDeleted},
	},
}

var OverviewCollapseEmptyListsSetting = SettingDefinition{
	FieldKey:      constants.SettingCollapseEmptyLists,
	DefaultChoice: "true",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

var OverviewMoveEmptyListsToBottomSetting = SettingDefinition{
	FieldKey:      constants.SettingMoveEmptyListsToBottom,
	DefaultChoice: "true",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

var LabSmartPrioritizeEnabledSetting = SettingDefinition{
	FieldKey:      constants.LabSmartPrioritizeEnabled,
	DefaultChoice: "false",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

var HasDismissedMulticalPromptSetting = SettingDefinition{
	FieldKey:      constants.HasDismissedMulticalPrompt,
	DefaultChoice: "false",
	Choices: []SettingChoice{
		{Key: "true"},
		{Key: "false"},
	},
}

var LinearTaskFilteringSetting = SettingDefinition{
	DefaultChoice: "all_cycles",
	Choices: []SettingChoice{
		{Key: "all_cycles"},
		{Key: "current_cycle"},
		{Key: "next_cycle"},
		{Key: "no_cycle"},
		{Key: "previous_cycle"},
	},
}

var TaskSectionSettingTypes = []string{"main", "overview"}

var hardcodedSettings = []SettingDefinition{
	// Github PR page settings
	GithubFilteringSetting,
	GithubSortingPreferenceSetting,
	GithubSortingDirectionSetting,
	// sidebar settings
	SidebarLinearSetting,
	SidebarJiraSetting,
	SidebarGithubSetting,
	SidebarSlackSetting,
	// notes page settings
	NoteSortingPreferenceSetting,
	NoteSortingDirectionSetting,
	NoteFilteringSetting,
	// recurring tasks page settings
	RecurringTaskFilteringSetting,
	// overview settings
	OverviewCollapseEmptyListsSetting,
	OverviewMoveEmptyListsToBottomSetting,
	// smart prioritize settings
	LabSmartPrioritizeEnabledSetting,
	// multical settings
	HasDismissedMulticalPromptSetting,
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
				FieldKey:      getGithubFieldKey(githubView, constants.SettingFieldGithubFilteringPreference),
				DefaultChoice: GithubFilteringSetting.DefaultChoice,
				Choices:       GithubFilteringSetting.Choices,
			},
			SettingDefinition{
				FieldKey:      getGithubFieldKey(githubView, constants.SettingFieldGithubSortingPreference),
				DefaultChoice: GithubSortingPreferenceSetting.DefaultChoice,
				Choices:       GithubSortingPreferenceSetting.Choices,
			},
			SettingDefinition{
				FieldKey:      getGithubFieldKey(githubView, constants.SettingFieldGithubSortingDirection),
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
					FieldKey:      getTaskSectionFieldKey(taskSection, constants.SettingFieldTaskSortingPreference, settingType),
					DefaultChoice: TaskSortingPreferenceSetting.DefaultChoice,
					Choices:       TaskSortingPreferenceSetting.Choices,
				},
				SettingDefinition{
					FieldKey:      getTaskSectionFieldKey(taskSection, constants.SettingFieldTaskSortingDirection, settingType),
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
	calendarChoices = append(calendarChoices, SettingChoice{
		Key:  "",
		Name: "",
	})
	settingsOptions = append(settingsOptions, SettingDefinition{
		FieldKey:      constants.SettingFieldCalendarForNewTasks,
		DefaultChoice: calendarChoices[0].Key,
		Choices:       calendarChoices,
	})

	calendarAccounts, err := database.GetCalendarAccounts(db, userID)
	if err != nil {
		return nil, err
	}
	calendarIDChoices := []SettingChoice{}
	for _, account := range *calendarAccounts {
		for _, calendar := range account.Calendars {
			calendarIDChoices = append(calendarIDChoices, SettingChoice{
				Key:  calendar.CalendarID,
				Name: calendar.Title,
			})
		}
	}
	calendarIDChoices = append(calendarIDChoices, SettingChoice{
		Key:  "",
		Name: "",
	})
	settingsOptions = append(settingsOptions, SettingDefinition{
		FieldKey:      constants.SettingFieldCalendarIDForNewTasks,
		DefaultChoice: calendarIDChoices[0].Key,
		Choices:       calendarIDChoices,
	})

	// linear task filtering
	lineartaskFilterSettingLinearPage := LinearTaskFilteringSetting
	lineartaskFilterSettingLinearPage.FieldKey = constants.SettingFieldLinearTaskFilteringPreference + "_linear_page"
	settingsOptions = append(settingsOptions, lineartaskFilterSettingLinearPage)

	lineartaskFilterSettingOverviewPage := LinearTaskFilteringSetting
	lineartaskFilterSettingOverviewPage.FieldKey = constants.SettingFieldLinearTaskFilteringPreference + "_overview"
	settingsOptions = append(settingsOptions, lineartaskFilterSettingOverviewPage)

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

func GetUserSettings(db *mongo.Database, userID primitive.ObjectID, settingsOptions *[]SettingDefinition) ([]UserSetting, error) {
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

	var settingsResponse []UserSetting
	for _, setting := range *settingsOptions {
		if setting.Hidden {
			continue
		}
		settingValue := GetSettingValue(userSettings, setting)
		settingsResponse = append(settingsResponse, UserSetting{
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
	err = database.UpdateUserSetting(db, userID, fieldKey, fieldValue)
	if err != nil {
		logger.Error().Err(err).Msg("failed to update user setting")
		return errors.New("internal server error")
	}
	return nil
}
