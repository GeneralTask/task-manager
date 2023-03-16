package api

import (
	"html"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) ShareableTaskPreview(c *gin.Context) {
	taskIDHex := c.Param("task_id")
	taskID, err := primitive.ObjectIDFromHex(taskIDHex)
	if err != nil {
		Handle404(c)
		return
	}

	var userID *primitive.ObjectID
	if userIDRaw, exists := c.Get("user"); exists {
		userIDValue := userIDRaw.(primitive.ObjectID)
		userID = &userIDValue
	}

	taskURL := getTaskURL(taskIDHex)
	task, err := database.GetSharedTask(api.DB, taskID, userID)
	if err != nil {
		NotFoundRedirect(c, taskURL)
		return
	}

	taskOwner, err := database.GetUser(api.DB, task.UserID)
	if err != nil {
		NotFoundRedirect(c, taskURL)
		return
	}

	previewTitle := ""
	if task.Title != nil {
		previewTitle = html.EscapeString(*task.Title)
	}
	body := []byte(`
	<!DOCTYPE html>
	<html>
	<head>
		<title>` + previewTitle + `</title>
		<meta http-equiv="Refresh" content="0; url='` + taskURL + `'" />
	
		<meta property="og:title" content="` + previewTitle + `" />
		<meta name="twitter:title" content="` + previewTitle + `">
	
		<meta content="Task shared by ` + taskOwner.Name + ` via General Task." property="og:description">
		<meta content="Task shared by ` + taskOwner.Name + ` via General Task." property="twitter:description">
	
		<meta property="og:type" content="website" />
		<meta property="og:url" content="` + config.GetConfigValue("SERVER_URL") + "task/" + task.ID.Hex() + `/" />
	</head>
	<body>
	</body>
	</html>`)
	c.Data(200, "text/html; charset=utf-8", body)
}

func getTaskURL(taskID string) string {
	return config.GetConfigValue("HOME_URL") + "task/" + taskID
}
