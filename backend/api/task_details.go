package api

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) TaskDetail(c *gin.Context) {
	taskIDHex := c.Param("task_id")
	taskID, err := primitive.ObjectIDFromHex(taskIDHex)
	if err != nil {
		// This means the task ID is improperly formatted
		Handle404(c)
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	task, err := database.GetTask(api.DB, c.Request.Context(), taskID, userID)
	if err != nil {
		Handle404(c)
		return
	}

	taskResult := api.taskBaseToTaskResult(task, userID)
	c.JSON(200, taskResult)
}
