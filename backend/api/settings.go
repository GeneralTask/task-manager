package api

import (
	"fmt"

	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/GeneralTask/task-manager/backend/settings"
	"github.com/gin-gonic/gin"
)

func (api *API) SettingsList(c *gin.Context) {
	userID := getUserIDFromContext(c)
	settingsOptions, err := settings.GetSettingsOptions(api.DB, userID)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to load setting definitions")
		Handle500(c)
		return
	}

	userSettings, err := settings.GetUserSettings(api.DB, userID, settingsOptions)
	if err != nil {
		logger.Error().Err(err).Msg("failed to load settings")
		Handle500(c)
		return
	}

	c.JSON(200, userSettings)
}

func (api *API) SettingsModify(c *gin.Context) {
	var settingsMap map[string]string
	err := c.BindJSON(&settingsMap)
	if err != nil {
		c.JSON(400, gin.H{"detail": "parameters missing or malformatted."})
		return
	}
	userID := getUserIDFromContext(c)
	for key, value := range settingsMap {
		err = settings.UpdateUserSetting(api.DB, userID, key, value)
		if err != nil {
			c.JSON(400, gin.H{"detail": fmt.Sprintf("failed to update settings: %v", err)})
			return
		}
	}
	c.JSON(200, gin.H{})
}
