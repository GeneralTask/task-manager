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
	lastAttemptTime := template.LastBackfillDatetime.Time()

	validBackfillTime, err := api.getValidCreationTimeNearLastBackfillAttempt(template, lastAttemptTime, localZone)
	if err != nil {
		api.Logger.Error().Err(err).Send()
		return err
	}

	var count int
	switch rate := *template.RecurrenceRate; rate {
	case Daily:
		count = api.countTasksToCreateForDailyTemplate(currentTime, validBackfillTime, template, localZone)
	case WeekDaily:
		count = api.countTasksToCreateForWeekDailyTemplate(currentTime, validBackfillTime, template, localZone)
	case Weekly:
		count = api.countTasksToCreateForWeeklyTemplate(currentTime, validBackfillTime, template, localZone)
	case Monthly:
		count = api.countTasksToCreateForMonthlyTemplate(currentTime, validBackfillTime, template, localZone)
	case Annually:
		count = api.countTasksToCreateForAnnualTemplate(currentTime, validBackfillTime, template, localZone)
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

func (api *API) getValidCreationTimeNearLastBackfillAttempt(template database.RecurringTaskTemplate, lastAttemptTime time.Time, localZone *time.Location) (time.Time, error) {
	// there are certain values that must be present depending on the recurrence type
	if template.RecurrenceRate == nil || template.TimeOfDaySecondsToCreateTask == nil {
		return time.Now(), errors.New("invalid template value")
	}
	if (*template.RecurrenceRate == Weekly || *template.RecurrenceRate == Monthly || *template.RecurrenceRate == Annually) && template.DayToCreateTask == nil {
		return time.Now(), errors.New("invalid template value")
	}
	if *template.RecurrenceRate == Annually && template.MonthToCreateTask == nil {
		return time.Now(), errors.New("invalid template value")
	}

	// get next backfill time after last backfill attempt
	// combine last triggered date with creation time variables from the template
	lastBackfillYear := lastAttemptTime.Year()
	lastBackfillMonth := lastAttemptTime.Month()
	lastBackfillDay := lastAttemptTime.Day()

	if *template.RecurrenceRate == Monthly || *template.RecurrenceRate == Annually {
		lastBackfillDay = *template.DayToCreateTask
	}
	if *template.RecurrenceRate == Annually {
		lastBackfillMonth = time.Month(*template.MonthToCreateTask)
	}

	// hour, minutes and seconds calculation always the same
	nextBackfillHour := int(*template.TimeOfDaySecondsToCreateTask / 3600)
	nextBackfillMinutes := int((*template.TimeOfDaySecondsToCreateTask - nextBackfillHour*3600) / 60)
	nextBackfillSeconds := int(*template.TimeOfDaySecondsToCreateTask % 60)

	validBackfillTime := time.Date(lastBackfillYear, lastBackfillMonth, lastBackfillDay, nextBackfillHour, nextBackfillMinutes, nextBackfillSeconds, 0, localZone)
	return validBackfillTime, nil
}

func (api *API) countNumberOfTasksToCreate(incrementYears int, incrementMonths int, incrementDays int, skipWeekends bool, currentTime time.Time, backfillAttemptTime time.Time) int {
	// return number of upcoming triggers before current local time
	count := 0
	for currentTime.Sub(backfillAttemptTime) > 0 {
		if !skipWeekends || (int(backfillAttemptTime.Weekday()) != int(time.Sunday) && int(backfillAttemptTime.Weekday()) != int(time.Saturday)) {
			count += 1
		}
		backfillAttemptTime = backfillAttemptTime.AddDate(incrementYears, incrementMonths, incrementDays)
	}
	return count
}

func (api *API) countTasksToCreateForDailyTemplate(currentTime time.Time, lastBackfillAttemptTime time.Time, validBackfillTime time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	// check if backfill time is before or after last backfill attempt
	// if after, add a day so it will be the next trigger time from the last attempt
	if lastBackfillAttemptTime.Sub(validBackfillTime) > 0 {
		validBackfillTime = validBackfillTime.AddDate(0, 0, 1)
	}

	return api.countNumberOfTasksToCreate(0, 0, 1, false, currentTime, validBackfillTime)
}

func (api *API) countTasksToCreateForWeekDailyTemplate(currentTime time.Time, lastBackfillAttemptTime time.Time, validBackfillTime time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	// check if backfill time is before or after last backfill attempt
	// if after, add a day so it will be the next trigger time from the last attempt
	if lastBackfillAttemptTime.Sub(validBackfillTime) > 0 {
		validBackfillTime = validBackfillTime.AddDate(0, 0, 1)
	}

	return api.countNumberOfTasksToCreate(0, 0, 1, true, currentTime, validBackfillTime)


func (api *API) countTasksToCreateForWeeklyTemplate(currentTime time.Time, lastBackfillAttemptTime time.Time, validBackfillTime time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	// check if backfill time is before or after last backfill attempt
	if lastBackfillAttemptTime.Sub(validBackfillTime) > 0 {
		validBackfillTime = validBackfillTime.AddDate(0, 0, 1)
	}
	// continue adding days until the weekday matches the day of the week which the trigger is
	for int(upcomingTrigger.Weekday()) != *template.DayToCreateTask {
		upcomingTrigger = upcomingTrigger.AddDate(0, 0, 1)
	}

	return api.countNumberOfTasksToCreate(0, 0, 7, false, currentTime, validBackfillTime)
}

func (api *API) countTasksToCreateForMonthlyTemplate(currentTime time.Time, lastBackfillAttemptTime time.Time, validBackfillTime time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	// check if backfill time is before or after last backfill attempt
	// if after, add a month so it will be the next trigger time from the last attempt
	if lastBackfillAttemptTime.Sub(validBackfillTime) > 0 {
		validBackfillTime = validBackfillTime.AddDate(0, 1, 0)
	}

	return api.countNumberOfTasksToCreate(0, 1, 0, false, currentTime, validBackfillTime)
}

func (api *API) countTasksToCreateForAnnualTemplate(currentTime time.Time, lastBackfillAttemptTime time.Time, validBackfillTime time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	// check if backfill time is before or after last backfill attempt
	// if after, add a year so it will be the next trigger time from the last attempt
	if lastBackfillAttemptTime.Sub(validBackfillTime) > 0 {
		validBackfillTime = validBackfillTime.AddDate(1, 0, 0)
	}

	return api.countNumberOfTasksToCreate(1, 0, 0, false, currentTime, validBackfillTime)
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
