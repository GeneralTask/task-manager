package api

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func (api *API) RecurringTaskTemplateList(c *gin.Context) {
	userID := getUserIDFromContext(c)

	var templates []database.RecurringTaskTemplate
	opts := options.Find().SetSort(bson.M{"created_at": 1})
	err := database.FindWithCollection(database.GetRecurringTaskTemplateCollection(api.DB), userID, &[]bson.M{{"is_deleted": false}}, &templates, opts)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch recurring task templates")
		Handle500(c)
		return
	}

	c.JSON(200, templates)
}
