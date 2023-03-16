package api

import (
	"fmt"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ShareableTaskDetailsResponse struct {
	Task     *TaskResultV4   `json:"task"`
	Subtasks []*TaskResultV4 `json:"subtasks"`
	Domain   string          `json:"domain"`
}

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
	if task == nil {
		Handle404(c)
		return
	}

	// Get subtasks for the shared task
	subtasks, err := database.GetSubtasksFromTask(api.DB, task)
	if err != nil {
		Handle404(c)
		return
	}
	subtaskResults := []*TaskResultV4{}
	for _, subtask := range *subtasks {
		subtaskResult := api.taskToTaskResultV4(&subtask)
		subtaskResults = append(subtaskResults, subtaskResult)
	}

	// Get the domain of the task owner
	taskOwner, err := database.GetUser(api.DB, task.UserID)
	if err != nil {
		Handle404(c)
		return
	}
	taskOwnerDomain, err := database.GetEmailDomain(taskOwner.Email)
	if err != nil {
		Handle404(c)
		return
	}

	taskResult := api.taskToTaskResultV4(task)
	result := ShareableTaskDetailsResponse{
		Task:     taskResult,
		Domain:   fmt.Sprintf(`@%s`, taskOwnerDomain),
		Subtasks: subtaskResults,
	}
	c.JSON(200, result)
}
