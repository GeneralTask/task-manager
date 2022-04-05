package api

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) ThreadDetail(c *gin.Context) {
	taskIDHex := c.Param("thread_id")
	taskID, err := primitive.ObjectIDFromHex(taskIDHex)
	if err != nil {
		// This means the task ID is improperly formatted
		Handle404(c)
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	thread, err := database.GetItem(c.Request.Context(), taskID, userID)
	if err != nil {
		Handle404(c)
		return
	}

	threadResponse := api.createThreadResponse(thread)
	c.JSON(200, threadResponse)
}
