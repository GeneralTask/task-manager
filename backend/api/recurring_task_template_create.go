package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RecurringTaskTemplateCreateParams struct {
	Title                        *string  `json:"title,omitempty" binding:"required"`
	Body                         *string  `json:"body,omitempty"`
	IDTaskSection                *string  `json:"id_task_section,omitempty"`
	PriorityNormalized           *float64 `json:"priority_normalized,omitempty"`
	RecurrenceRate               *int     `json:"recurrence_rate,omitempty" binding:"required"`
	TimeOfDaySecondsToCreateTask *int     `json:"time_of_day_seconds_to_create_task,omitempty" binding:"required"`
	DayToCreateTask              *int     `json:"day_to_create_task,omitempty"`
	MonthToCreateTask            *int     `json:"month_to_create_task,omitempty"`
}

func (api *API) RecurringTaskTemplateCreate(c *gin.Context) {
	var templateCreateParams RecurringTaskTemplateCreateParams
	err := c.BindJSON(&templateCreateParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}

	userID := getUserIDFromContext(c)

	var taskSection primitive.ObjectID
	if templateCreateParams.IDTaskSection != nil {
		taskSection, err = getValidTaskSection(*templateCreateParams.IDTaskSection, userID, api.DB)
		if err != nil {
			c.JSON(400, gin.H{"detail": "'id_task_section' is not a valid ID"})
			return
		}
	}

	enabled := true
	deleted := false
	newTemplate := database.RecurringTaskTemplate{
		UserID:                       userID,
		Title:                        templateCreateParams.Title,
		Body:                         templateCreateParams.Body,
		IDTaskSection:                taskSection,
		PriorityNormalized:           templateCreateParams.PriorityNormalized,
		IsEnabled:                    &enabled,
		IsDeleted:                    &deleted,
		RecurrenceRate:               templateCreateParams.RecurrenceRate,
		TimeOfDaySecondsToCreateTask: templateCreateParams.TimeOfDaySecondsToCreateTask,
		DayToCreateTask:              templateCreateParams.DayToCreateTask,
		MonthToCreateTask:            templateCreateParams.MonthToCreateTask,
		LastBackfillDatetime:         primitive.NewDateTimeFromTime(api.GetCurrentTime()),
	}

	templateCollection := database.GetRecurringTaskTemplateCollection(api.DB)
	insertID, err := templateCollection.InsertOne(context.Background(), newTemplate)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to create recurring task template")
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{"template_id": insertID.InsertedID.(primitive.ObjectID)})
}
