package settings

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/GeneralTask/task-manager/backend/constants"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
)

func TestGetSettingsOptions(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID := primitive.NewObjectID()
	viewCollection := database.GetViewCollection(db)
	view := database.View{
		UserID: userID,
		Type:   string(constants.ViewGithub),
	}
	res, err := viewCollection.InsertOne(context.Background(), view)
	assert.NoError(t, err)
	insertedViewID := res.InsertedID.(primitive.ObjectID).Hex()
	// wrong user ID
	_, err = viewCollection.InsertOne(context.Background(), database.View{
		UserID: primitive.NewObjectID(),
		Type:   string(constants.ViewGithub),
	})
	assert.NoError(t, err)
	// wrong view type
	_, err = viewCollection.InsertOne(context.Background(), database.View{
		UserID: userID,
		Type:   string(constants.ViewLinear),
	})
	assert.NoError(t, err)

	taskSectionCollection := database.GetTaskSectionCollection(db)
	res, err = taskSectionCollection.InsertOne(context.Background(), database.TaskSection{UserID: userID})
	assert.NoError(t, err)
	// wrong user ID
	_, err = taskSectionCollection.InsertOne(context.Background(), database.TaskSection{UserID: primitive.NewObjectID()})
	assert.NoError(t, err)
	insertedSectionID := res.InsertedID.(primitive.ObjectID).Hex()

	externalTokenCollection := database.GetExternalTokenCollection(db)
	_, err = externalTokenCollection.InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: external.TASK_SERVICE_ID_GOOGLE,
			AccountID: "a",
			DisplayID: "oof 1",
		},
	)
	assert.NoError(t, err)
	_, err = externalTokenCollection.InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: external.TASK_SERVICE_ID_GOOGLE,
			AccountID: "b",
			DisplayID: "oof 2",
		},
	)
	assert.NoError(t, err)
	// wrong user id
	_, err = externalTokenCollection.InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			UserID:    primitive.NewObjectID(),
			ServiceID: external.TASK_SERVICE_ID_GOOGLE,
		},
	)
	assert.NoError(t, err)
	// wrong service id
	_, err = externalTokenCollection.InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: "gabagool",
		},
	)
	assert.NoError(t, err)

	t.Run("Success", func(t *testing.T) {
		settings, err := GetSettingsOptions(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 24, len(*settings))
		assert.Equal(t, "sidebar_linear_preference", (*settings)[3].FieldKey)
		assert.Equal(t, "sidebar_jira_preference", (*settings)[4].FieldKey)
		assert.Equal(t, "sidebar_github_preference", (*settings)[5].FieldKey)
		assert.Equal(t, "sidebar_slack_preference", (*settings)[6].FieldKey)
		assert.Equal(t, "note_sorting_preference", (*settings)[7].FieldKey)
		assert.Equal(t, "note_sorting_direction", (*settings)[8].FieldKey)
		assert.Equal(t, "note_filtering_preference", (*settings)[9].FieldKey)
		assert.Equal(t, "collapse_empty_lists", (*settings)[10].FieldKey)
		assert.Equal(t, "most_empty_lists_to_bottom", (*settings)[11].FieldKey)
		assert.Equal(t, insertedViewID+"_github_filtering_preference", (*settings)[12].FieldKey)
		assert.Equal(t, insertedViewID+"_github_sorting_preference", (*settings)[13].FieldKey)
		assert.Equal(t, insertedViewID+"_github_sorting_direction", (*settings)[14].FieldKey)
		assert.Equal(t, insertedSectionID+"_task_sorting_preference_main", (*settings)[15].FieldKey)
		assert.Equal(t, insertedSectionID+"_task_sorting_direction_main", (*settings)[16].FieldKey)
		assert.Equal(t, insertedSectionID+"_task_sorting_preference_overview", (*settings)[17].FieldKey)
		assert.Equal(t, insertedSectionID+"_task_sorting_direction_overview", (*settings)[18].FieldKey)
		assert.Equal(t, "000000000000000000000001_task_sorting_preference_main", (*settings)[19].FieldKey)
		assert.Equal(t, "000000000000000000000001_task_sorting_direction_main", (*settings)[20].FieldKey)
		assert.Equal(t, "000000000000000000000001_task_sorting_preference_overview", (*settings)[21].FieldKey)
		assert.Equal(t, "000000000000000000000001_task_sorting_direction_overview", (*settings)[22].FieldKey)
		calendarSetting := (*settings)[23]
		assert.Equal(t, SettingFieldCalendarForNewTasks, calendarSetting.FieldKey)
		assert.Equal(t, "a", calendarSetting.DefaultChoice)
		assert.Equal(t, []SettingChoice{
			{Key: "a", Name: "oof 1"},
			{Key: "b", Name: "oof 2"},
		}, calendarSetting.Choices)
	})
}
