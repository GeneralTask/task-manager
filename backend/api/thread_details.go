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
		c.JSON(404, gin.H{"detail": "thread not found"})
		return
	}

	threadResponse := api.createThreadResponse(thread)
	c.JSON(200, threadResponse)
}

// func (api *API) taskBaseToTaskResult(t *database.Item) *TaskResult {
// 	taskSourceResult, _ := api.ExternalConfig.GetTaskSourceResult(t.SourceID)
// 	var dueDate string
// 	if t.DueDate.Time().Unix() == int64(0) {
// 		dueDate = ""
// 	} else {
// 		dueDate = t.DueDate.Time().Format("2006-01-02")
// 	}

// 	return &TaskResult{
// 		ID:         t.ID,
// 		IDOrdering: t.IDOrdering,
// 		Source: TaskSource{
// 			Name:          taskSourceResult.Details.Name,
// 			Logo:          taskSourceResult.Details.Logo,
// 			LogoV2:        taskSourceResult.Details.LogoV2,
// 			IsCompletable: taskSourceResult.Details.IsCompletable,
// 			IsReplyable:   taskSourceResult.Details.IsReplyable,
// 		},
// 		Deeplink:       t.Deeplink,
// 		Title:          t.Title,
// 		Body:           t.Body,
// 		TimeAllocation: t.TimeAllocation,
// 		Sender:         t.Sender,
// 		Recipients: Recipients{
// 			To:  getRecipients(t.Recipients.To),
// 			Cc:  getRecipients(t.Recipients.Cc),
// 			Bcc: getRecipients(t.Recipients.Bcc),
// 		},
// 		SentAt:  t.CreatedAtExternal.Time().Format(time.RFC3339),
// 		DueDate: dueDate,
// 		IsDone:  t.IsCompleted,
// 	}
// }
