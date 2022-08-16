package api

import (
	"fmt"

	"github.com/GeneralTask/task-manager/backend/settings"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) SettingsList(c *gin.Context) {
	userID, _ := c.Get("user")
	userSettings := []settings.UserSetting{}
	for _, setting := range settings.Settings {
		if setting.Hidden {
			continue
		}
		settingValue, err := settings.GetUserSetting(api.DB, userID.(primitive.ObjectID), setting.FieldKey)
		if err != nil {
			Handle500(c)
			return
		}
		userSettings = append(userSettings, settings.UserSetting{
			SettingDefinition: setting,
			FieldValue:        *settingValue,
		})
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
	userID, _ := c.Get("user")
	for key, value := range settingsMap {
		err = settings.UpdateUserSetting(api.DB, userID.(primitive.ObjectID), key, value)
		if err != nil {
			c.JSON(400, gin.H{"detail": fmt.Sprintf("failed to update settings: %v", err)})
			return
		}
	}
	c.JSON(200, gin.H{})
}
