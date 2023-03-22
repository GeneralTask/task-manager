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

	userID := getUserIDFromContext(c)

	task, err := database.GetTask(api.DB, taskID, userID)
	if err != nil {
		Handle404(c)
		return
	}

	taskResult := api.taskToTaskResultV4(task)
	c.JSON(200, taskResult)
}
