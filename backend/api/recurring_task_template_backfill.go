package api

import (
	"context"
	"errors"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	Daily     int = 0
	WeekDaily     = 1
	Weekly        = 2
	Monthly       = 3
	Annually      = 4
)

func (api *API) RecurringTaskTemplateBackfillTasks(c *gin.Context) {
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
		err := api.backfillTemplate(c, template)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to backfill recurring task template")
			Handle500(c)
			return
		}

		currentBackfillDatetime := primitive.NewDateTimeFromTime(time.Now())
		updateResult := database.GetRecurringTaskTemplateCollection(api.DB).FindOneAndUpdate(
			context.Background(),
			bson.M{
				"$and": []bson.M{
					{"_id": template.ID},
					{"user_id": userID},
				},
			},
			bson.M{"$set": bson.M{"last_backfill_datetime": currentBackfillDatetime}},
			options.FindOneAndUpdate().SetReturnDocument(options.After),
		)
		if updateResult.Err() != nil {
			api.Logger.Error().Err(err).Msg("failed to modify recurring task template trigger time")
			Handle500(c)
			return
		}
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
	currentTime := time.Now()
	lastTriggered := template.LastBackfillDatetime.Time()

	var count int
	switch rate := *template.RecurrenceRate; rate {
	case Daily:
		count = api.countToCreateDaily(currentTime, lastTriggered, template, localZone)
	case WeekDaily:
		count = api.countToCreateWeekDaily(currentTime, lastTriggered, template, localZone)
	case Weekly:
		count = api.countToCreateWeekly(currentTime, lastTriggered, template, localZone)
	case Monthly:
		count = api.countToCreateMonthly(currentTime, lastTriggered, template, localZone)
	case Annually:
		count = api.countToCreateYearly(currentTime, lastTriggered, template, localZone)
	default:
		api.Logger.Error().Msg("unrecognized recurrence rate for template backfill")
		return errors.New("unrecognized recurrence rate for template backfill")
	}

	var tasks []interface{}
	for i := 0; i < count; i++ {
		taskCopy := api.createTaskFromTemplate(template)
		tasks = append(tasks, taskCopy)
	}

	if len(tasks) > 0 {
		_, err = database.GetTaskCollection(api.DB).InsertMany(context.Background(), tasks)
		if err != nil {
			api.Logger.Error().Msg("unable to insert tasks from template")
			return err
		}
	}

	return nil
}

func (api *API) countToCreateDaily(currentLocalTime time.Time, lastTriggeredLocal time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	if template.CreationTimeSeconds == nil {
		api.Logger.Error().Msg("invalid template variables")
		return 0
	}

	// get the next trigger time
	upcomingHour := int(*template.CreationTimeSeconds / 3600)
	upcomingMinutes := int((*template.CreationTimeSeconds - upcomingHour*3600) / 60)
	upcomingTrigger := time.Date(lastTriggeredLocal.Year(), lastTriggeredLocal.Month(), lastTriggeredLocal.Day(), upcomingHour, upcomingMinutes, int(*template.CreationTimeSeconds%60), 0, localZone)

	if lastTriggeredLocal.Sub(upcomingTrigger) > 0 {
		upcomingTrigger = upcomingTrigger.AddDate(0, 0, 1)
	}

	// return number of upcoming triggers before current local time
	count := 0
	for currentLocalTime.Sub(upcomingTrigger) > 0 {
		count += 1
		upcomingTrigger = upcomingTrigger.AddDate(0, 0, 1)
	}
	return count
}

func (api *API) countToCreateWeekDaily(currentLocalTime time.Time, lastTriggeredLocal time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	if template.CreationTimeSeconds == nil {
		api.Logger.Error().Msg("invalid template variables")
		return 0
	}

	upcomingHour := int(*template.CreationTimeSeconds / 3600)
	upcomingMinutes := int((*template.CreationTimeSeconds - upcomingHour*3600) / 60)
	upcomingTrigger := time.Date(lastTriggeredLocal.Year(), lastTriggeredLocal.Month(), lastTriggeredLocal.Day(), upcomingHour, upcomingMinutes, int(*template.CreationTimeSeconds%60), 0, localZone)

	if lastTriggeredLocal.Sub(upcomingTrigger) > 0 {
		upcomingTrigger = upcomingTrigger.AddDate(0, 0, 1)
		for int(upcomingTrigger.Weekday()) == int(time.Sunday) || int(upcomingTrigger.Weekday()) == int(time.Saturday) {
			upcomingTrigger = upcomingTrigger.AddDate(0, 0, 1)
		}
	}

	count := 0
	for currentLocalTime.Sub(upcomingTrigger) > 0 {
		if int(upcomingTrigger.Weekday()) != int(time.Sunday) && int(upcomingTrigger.Weekday()) != int(time.Saturday) {
			count += 1
		}
		upcomingTrigger = upcomingTrigger.AddDate(0, 0, 1)
	}
	return count
}

func (api *API) countToCreateWeekly(currentLocalTime time.Time, lastTriggeredLocal time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	if template.CreationTimeSeconds == nil || template.CreationDay == nil {
		api.Logger.Error().Msg("invalid template variables")
		return 0
	}

	upcomingHour := int(*template.CreationTimeSeconds / 3600)
	upcomingMinutes := int((*template.CreationTimeSeconds - upcomingHour*3600) / 60)
	upcomingTrigger := time.Date(lastTriggeredLocal.Year(), lastTriggeredLocal.Month(), lastTriggeredLocal.Day(), upcomingHour, upcomingMinutes, int(*template.CreationTimeSeconds%60), 0, localZone)

	if lastTriggeredLocal.Sub(upcomingTrigger) > 0 {
		upcomingTrigger = upcomingTrigger.AddDate(0, 0, 1)
	}

	for int(upcomingTrigger.Weekday()) != *template.CreationDay {
		upcomingTrigger = upcomingTrigger.AddDate(0, 0, 1)
	}

	count := 0
	for currentLocalTime.Sub(upcomingTrigger) > 0 {
		count += 1
		upcomingTrigger = upcomingTrigger.AddDate(0, 0, 7)
	}
	return count
}

func (api *API) countToCreateMonthly(currentLocalTime time.Time, lastTriggeredLocal time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	if template.CreationTimeSeconds == nil || template.CreationDay == nil {
		api.Logger.Error().Msg("invalid template variables")
		return 0
	}

	upcomingHour := int(*template.CreationTimeSeconds / 3600)
	upcomingMinutes := int((*template.CreationTimeSeconds - upcomingHour*3600) / 60)
	upcomingTrigger := time.Date(lastTriggeredLocal.Year(), lastTriggeredLocal.Month(), *template.CreationDay, upcomingHour, upcomingMinutes, int(*template.CreationTimeSeconds%60), 0, localZone)

	if lastTriggeredLocal.Sub(upcomingTrigger) > 0 {
		upcomingTrigger = upcomingTrigger.AddDate(0, 1, 0)
	}

	count := 0
	for currentLocalTime.Sub(upcomingTrigger) > 0 {
		count += 1
		upcomingTrigger = upcomingTrigger.AddDate(0, 1, 0)
	}
	return count
}

func (api *API) countToCreateYearly(currentLocalTime time.Time, lastTriggeredLocal time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	if template.CreationTimeSeconds == nil || template.CreationDay == nil || template.CreationMonth == nil {
		api.Logger.Error().Msg("invalid template variables")
		return 0
	}

	upcomingHour := int(*template.CreationTimeSeconds / 3600)
	upcomingMinutes := int((*template.CreationTimeSeconds - upcomingHour*3600) / 60)
	upcomingTrigger := time.Date(lastTriggeredLocal.Year(), time.Month(*template.CreationMonth), *template.CreationDay, upcomingHour, upcomingMinutes, int(*template.CreationTimeSeconds%60), 0, localZone)

	if lastTriggeredLocal.Sub(upcomingTrigger) > 0 {
		upcomingTrigger = upcomingTrigger.AddDate(1, 0, 0)
	}

	count := 0
	for currentLocalTime.Sub(upcomingTrigger) > 0 {
		count += 1
		upcomingTrigger = upcomingTrigger.AddDate(1, 0, 0)
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
