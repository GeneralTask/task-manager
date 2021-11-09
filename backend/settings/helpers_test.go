package settings_test

import (
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/settings"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestSettingsGet(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()

	t.Run("DefaultValue", func(t *testing.T) {
		assert.Equal(t, int64(3600000000000), settings.GetDefaultTaskDuration(db, userID))
	})
	t.Run("NonDefaultValue", func(t *testing.T) {
		err := settings.UpdateUserSetting(
			db,
			userID,
			settings.SettingFieldDefaultTaskDuration,
			settings.ChoiceKey30Minutes,
		)
		assert.NoError(t, err)
		assert.Equal(t, int64(1800000000000), settings.GetDefaultTaskDuration(db, userID))
	})
}
