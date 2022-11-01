package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type RecurringTaskTemplateModifyParams struct {
	Title               string   `json:"title,omitempty"`
	Body                string   `json:"body,omitempty"`
	IDTaskSection       *string  `json:"id_task_section,omitempty"`
	PriorityNormalized  *float64 `json:"priority_normalized,omitempty"`
	RecurrenceRate      int      `json:"recurrence_rate,omitempty"`
	CreationTimeSeconds int      `json:"creation_time_seconds,omitempty"`
	CreationDay         int      `json:"creation_day,omitempty"`
	CreationMonth       int      `json:"creation_month,omitempty"`
	IsEnabled           *bool    `json:"is_enabled,omitempty"`
	IsDeleted           *bool    `json:"is_deleted,omitempty"`
}

func (api *API) RecurringTaskTemplateModify(c *gin.Context) {
	templateIDHex := c.Param("template_id")
	templateID, err := primitive.ObjectIDFromHex(templateIDHex)
	if err != nil {
		// This means the task ID is improperly formatted
		Handle404(c)
		return
	}

	var modifyParams RecurringTaskTemplateModifyParams
	err = c.BindJSON(&modifyParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	var taskSection primitive.ObjectID
	if modifyParams.IDTaskSection != nil {
		taskSection, err = primitive.ObjectIDFromHex(*modifyParams.IDTaskSection)
		if err != nil {
			c.JSON(400, gin.H{"detail": "'id_task_section' is not a valid ID"})
			return
		}
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	var template database.RecurringTaskTemplate
	result := database.FindOneWithCollection(database.GetRecurringTaskTemplateCollection(api.DB), userID, templateID)
	err = result.Decode(&template)
	if err != nil {
		c.JSON(400, gin.H{"detail": "could not fetch template from database"})
		return
	}

	// check if all fields are empty
	if modifyParams == (RecurringTaskTemplateModifyParams{}) {
		c.JSON(400, gin.H{"detail": "parameter missing"})
		return
	}

	updateTemplate := database.RecurringTaskTemplate{
		Title:               &modifyParams.Title,
		Body:                &modifyParams.Body,
		PriorityNormalized:  modifyParams.PriorityNormalized,
		RecurrenceRate:      modifyParams.RecurrenceRate,
		CreationTimeSeconds: modifyParams.CreationTimeSeconds,
		CreationDay:         modifyParams.CreationDay,
		CreationMonth:       modifyParams.CreationMonth,
		IsEnabled:           modifyParams.IsEnabled,
		IsDeleted:           modifyParams.IsDeleted,
	}
	if modifyParams.IDTaskSection != nil {
		updateTemplate.IDTaskSection = taskSection
	}

	mongoResult := database.GetRecurringTaskTemplateCollection(api.DB).FindOneAndUpdate(
		context.Background(),
		bson.M{
			"$and": []bson.M{
				{"_id": templateID},
				{"user_id": userID},
			},
		},
		bson.M{"$set": updateTemplate},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	if mongoResult.Err() != nil {
		api.Logger.Error().Err(err).Msg("failed to modify recurring task template")
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{})
}
