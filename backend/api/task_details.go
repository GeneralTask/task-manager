package api

import (
	"context"

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

	task, err := database.GetTask(api.DB, context.Background(), taskID, userID)
	if err != nil {
		Handle404(c)
		return
	}

	taskResult := api.taskBaseToTaskResult(task, userID)
	// should fetch subTasks as we only have a single task in memory
	subTasks := api.getSubtaskResults(task, userID)
	if subTasks != nil {
		taskResult.SubTasks = subTasks
	}
	c.JSON(200, taskResult)
}
