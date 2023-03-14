package api

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) ShareableTaskDetails(c *gin.Context) {
	taskIDHex := c.Param("task_id")
	taskID, err := primitive.ObjectIDFromHex(taskIDHex)
	if err != nil {
		// This means the task ID is improperly formatted
		Handle404(c)
		return
	}

	/* We can't use getUserIDFromContext here because the "user" context field is potentially empty.
	 * This is the case when an unauthenticated user hits this endpoint.
	 */
	var userID *primitive.ObjectID
	if userIDRaw, exists := c.Get("user"); exists {
		userIDValue := userIDRaw.(primitive.ObjectID)
		userID = &userIDValue
	}

	task, err := database.GetSharedTask(api.DB, taskID, userID)
	if err != nil {
		Handle404(c)
		return
	}

	taskResult := api.taskToTaskResultV4(task)
	c.JSON(200, taskResult)
}
