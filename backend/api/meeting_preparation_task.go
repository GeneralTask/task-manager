package api

import (


	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
)


func (api *API) MeetingPreparationTasksList(c *gin.Context) {
	userID := getUserIDFromContext(c)
	_, err := database.GetUser(api.DB, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to get user")
		Handle500(c)
		return
	}
	timezoneOffset, err := GetTimezoneOffsetFromHeader(c)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	meetingTasksResult, err := api.GetMeetingPreparationTasksResultV4(userID, timezoneOffset)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to get meeting preparation tasks")
		Handle500(c)
	}

	c.JSON(200, meetingTasksResult)
}
