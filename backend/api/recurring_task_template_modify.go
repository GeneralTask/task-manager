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
	Title                        *string  `json:"title,omitempty"`
	Body                         *string  `json:"body,omitempty"`
	IDTaskSection                *string  `json:"id_task_section,omitempty"`
	PriorityNormalized           *float64 `json:"priority_normalized,omitempty"`
	RecurrenceRate               *int     `json:"recurrence_rate,omitempty"`
	TimeOfDaySecondsToCreateTask *int     `json:"time_of_day_seconds_to_create_task,omitempty"`
	DayToCreateTask              *int     `json:"day_to_create_task,omitempty"`
	MonthToCreateTask            *int     `json:"month_to_create_task,omitempty"`
	IsEnabled                    *bool    `json:"is_enabled,omitempty"`
	IsDeleted                    *bool    `json:"is_deleted,omitempty"`
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

	userID := getUserIDFromContext(c)

	var taskSection primitive.ObjectID
	if modifyParams.IDTaskSection != nil {
		taskSection, err = getValidTaskSection(*modifyParams.IDTaskSection, userID, api.DB)
		if err != nil {
			c.JSON(400, gin.H{"detail": "'id_task_section' is not a valid ID"})
			return
		}
	}

	var template database.RecurringTaskTemplate
	result := database.FindOneWithCollection(database.GetRecurringTaskTemplateCollection(api.DB), userID, templateID)
	err = result.Decode(&template)
	if err != nil {
		c.JSON(404, gin.H{"detail": "template not found", "templateID": templateID})
		return
	}

	// check if all fields are empty
	if modifyParams == (RecurringTaskTemplateModifyParams{}) {
		c.JSON(400, gin.H{"detail": "template changes missing"})
		return
	}

	updateTemplate := database.RecurringTaskTemplate{
		Title:                        modifyParams.Title,
		Body:                         modifyParams.Body,
		PriorityNormalized:           modifyParams.PriorityNormalized,
		IsEnabled:                    modifyParams.IsEnabled,
		IsDeleted:                    modifyParams.IsDeleted,
		RecurrenceRate:               modifyParams.RecurrenceRate,
		TimeOfDaySecondsToCreateTask: modifyParams.TimeOfDaySecondsToCreateTask,
		DayToCreateTask:              modifyParams.DayToCreateTask,
		MonthToCreateTask:            modifyParams.MonthToCreateTask,
		IDTaskSection:                taskSection,
		UpdatedAt:                    primitive.NewDateTimeFromTime(api.GetCurrentTime()),
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
