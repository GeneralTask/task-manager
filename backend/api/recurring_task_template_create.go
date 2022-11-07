package api

import (
	"context"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RecurringTaskTemplateCreateParams struct {
	Title               *string  `json:"title,omitempty"`
	Body                *string  `json:"body,omitempty"`
	IDTaskSection       *string  `json:"id_task_section,omitempty"`
	PriorityNormalized  *float64 `json:"priority_normalized,omitempty"`
	RecurrenceRate      *int     `json:"recurrence_rate,omitempty"`
	CreationTimeSeconds *int     `json:"creation_time_seconds,omitempty"`
	CreationDay         *int     `json:"creation_day,omitempty"`
	CreationMonth       *int     `json:"creation_month,omitempty"`
}

func (api *API) RecurringTaskTemplateCreate(c *gin.Context) {
	var templateCreateParams RecurringTaskTemplateCreateParams
	err := c.BindJSON(&templateCreateParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	taskSection := constants.IDTaskSectionDefault
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
		UserID:               userID,
		Title:                templateCreateParams.Title,
		Body:                 templateCreateParams.Body,
		IDTaskSection:        taskSection,
		PriorityNormalized:   templateCreateParams.PriorityNormalized,
		IsEnabled:            &enabled,
		IsDeleted:            &deleted,
		RecurrenceRate:       templateCreateParams.RecurrenceRate,
		CreationTimeSeconds:  templateCreateParams.CreationTimeSeconds,
		CreationDay:          templateCreateParams.CreationDay,
		LastBackfillDatetime: primitive.NewDateTimeFromTime(time.Now()),
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
