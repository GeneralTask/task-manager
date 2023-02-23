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
	
	meetingTasks, err := api.CreateMeetingPreparationTaskList(userID, timezoneOffset, true)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to get meeting preparation tasks")
		Handle500(c)
	}

	meetingTaskResult := api.taskListToTaskResultListV4(meetingTasks, userID)

	c.JSON(200, meetingTaskResult)
}