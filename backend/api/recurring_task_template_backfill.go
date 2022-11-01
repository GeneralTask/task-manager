package api

import (
	"errors"
	"fmt"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	Daily     int = 0
	WeekDaily     = 1
	Weekly        = 2
	Monthly       = 3
	Annually      = 4
)

func (api *API) RecurringTaskTemplateBackfill(c *gin.Context) {
	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	var templates []database.RecurringTaskTemplate
	err := database.FindWithCollection(database.GetRecurringTaskTemplateCollection(api.DB), userID, &[]bson.M{{"is_deleted": false}, {"is_enabled": true}}, &templates, nil)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch recurring task templates")
		Handle500(c)
		return
	}

	for _, template := range templates {
		api.backfillTemplate(c, template)
	}

	c.JSON(200, templates)
}

func (api *API) backfillTemplate(c *gin.Context, template database.RecurringTaskTemplate) error {
	offset, err := GetTimezoneOffsetFromHeader(c)
	if err != nil {
		api.Logger.Error().Msg("unable to get localized time")
		return err
	}
	localZone := time.FixedZone("", int(-1*offset.Seconds()))
	currentLocalTime := api.GetCurrentLocalizedTime(offset)
	lastTriggered := template.LastTriggered.Time()
	lastTriggeredLocal := lastTriggered.In(localZone)

	/// users local time
	/// if local time > creation time && last triggered < this creation time (in local timezone)

	var count int
	switch rate := template.RecurrenceRate; rate {
	case Daily:
		count = api.countToCreateDaily(currentLocalTime, lastTriggeredLocal, template, localZone)
	case WeekDaily:
		count = api.countToCreateWeekDaily(currentLocalTime, lastTriggeredLocal, template, localZone)
	case Weekly:
		fmt.Println("OS X.")
	case Monthly:
		fmt.Println("OS X.")
	case Annually:
		fmt.Println("OS X.")
	default:
		api.Logger.Error().Msg("unrecognized recurrence rate for template backfill")
		return errors.New("unrecognized recurrence rate for template backfill")
	}

	tasks := []database.Task{}
	for i := 0; i < count; i++ {
		tasks = append(tasks, api.createTaskFromTemplate(template))
	}

	// insert many of tasks
	return nil
}

func (api *API) countToCreateDaily(currentLocalTime time.Time, lastTriggeredLocal time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	upcomingTrigger := time.Date(lastTriggeredLocal.Year(), lastTriggeredLocal.Month(), lastTriggeredLocal.Day(), int(template.CreationTimeSeconds/3600), int(template.CreationTimeSeconds/60), int(template.CreationTimeSeconds%60), 0, localZone)
	if lastTriggeredLocal.Sub(upcomingTrigger) > 0 {
		upcomingTrigger = upcomingTrigger.Add(time.Hour * 24)
	}

	timeFromTrigger := currentLocalTime.Sub(upcomingTrigger)
	if timeFromTrigger > 0 {
		return int(timeFromTrigger.Hours() / 24)
	}

	return 0
}

func (api *API) countToCreateWeekDaily(currentLocalTime time.Time, lastTriggeredLocal time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	upcomingTrigger := time.Date(lastTriggeredLocal.Year(), lastTriggeredLocal.Month(), lastTriggeredLocal.Day(), int(template.CreationTimeSeconds/3600), int(template.CreationTimeSeconds/60), int(template.CreationTimeSeconds%60), 0, localZone)
	if lastTriggeredLocal.Sub(upcomingTrigger) > 0 {
		upcomingTrigger = upcomingTrigger.Add(time.Hour * 24)
		for upcomingTrigger.Weekday() == 0 || upcomingTrigger.Weekday() == 6 {
			upcomingTrigger = upcomingTrigger.Add(time.Hour * 24)
		}
	}

	count := 0
	for currentLocalTime.Sub(upcomingTrigger) > 0 {
		if upcomingTrigger.Weekday() != 0 && upcomingTrigger.Weekday() != 6 {
			count += 1
		}
		upcomingTrigger = upcomingTrigger.Add(time.Hour * 24)
	}
	return count
}

func (api *API) createTaskFromTemplate(template database.RecurringTaskTemplate) database.Task {
	completed := false
	return database.Task{
		UserID:                  template.UserID,
		RecurringTaskTemplateID: template.ID,
		SourceID:                external.TASK_SOURCE_ID_GT_TASK,
		Title:                   template.Title,
		Body:                    template.Body,
		IDTaskSection:           template.IDTaskSection,
		PriorityNormalized:      template.PriorityNormalized,
		IsCompleted:             &completed,
	}
}
