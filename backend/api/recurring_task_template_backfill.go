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
	userID := getUserIDFromContext(c)

	var templates []database.RecurringTaskTemplate
	err := database.FindWithCollection(database.GetRecurringTaskTemplateCollection(api.DB), userID, &[]bson.M{{"is_deleted": false}, {"is_enabled": true}}, &templates, nil)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch recurring task templates")
		Handle500(c)
		return
	}

	for _, template := range templates {
		currentTime, err := api.backfillTemplate(c, template)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to backfill recurring task template")
			Handle500(c)
			return
		}

		updateResult := database.GetRecurringTaskTemplateCollection(api.DB).FindOneAndUpdate(
			context.Background(),
			bson.M{
				"$and": []bson.M{
					{"_id": template.ID},
					{"user_id": userID},
				},
			},
			bson.M{"$set": bson.M{"last_backfill_datetime": currentTime}},
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

func (api *API) backfillTemplate(c *gin.Context, template database.RecurringTaskTemplate) (time.Time, error) {
	offset, err := GetTimezoneOffsetFromHeader(c)
	if err != nil {
		api.Logger.Error().Msg("unable to get localized time")
		return time.Now(), err
	}
	localZone := time.FixedZone("", int(-1*offset.Seconds()))
	currentTime := time.Now()
	lastAttemptTime := template.LastBackfillDatetime.Time()

	validCreationTime, err := api.getValidCreationTimeNearLastBackfillAttempt(template, lastAttemptTime, localZone)
	if err != nil {
		api.Logger.Error().Err(err).Send()
		return currentTime, err
	}

	var count int
	switch rate := *template.RecurrenceRate; rate {
	case Daily:
		count = api.countTasksToCreateForDailyTemplate(currentTime, lastAttemptTime, validCreationTime, template, localZone)
	case WeekDaily:
		count = api.countTasksToCreateForWeekDailyTemplate(currentTime, lastAttemptTime, validCreationTime, template, localZone)
	case Weekly:
		count = api.countTasksToCreateForWeeklyTemplate(currentTime, lastAttemptTime, validCreationTime, template, localZone)
	case Monthly:
		count = api.countTasksToCreateForMonthlyTemplate(currentTime, lastAttemptTime, validCreationTime, template, localZone)
	case Annually:
		count = api.countTasksToCreateForAnnualTemplate(currentTime, lastAttemptTime, validCreationTime, template, localZone)
	default:
		api.Logger.Error().Msg("unrecognized recurrence rate for template backfill")
		return currentTime, errors.New("unrecognized recurrence rate for template backfill")
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
			return currentTime, err
		}
	}

	return currentTime, nil
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

	validCreationTime := time.Date(lastBackfillYear, lastBackfillMonth, lastBackfillDay, nextBackfillHour, nextBackfillMinutes, nextBackfillSeconds, 0, localZone)
	return validCreationTime, nil
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

func (api *API) countTasksToCreateForDailyTemplate(currentTime time.Time, lastBackfillAttemptTime time.Time, validCreationTime time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	// check if proposed backfill time is before or after last attempt
	// backfill time is based upon last attempt time (it should be same day as the last attempt)
	// if proposed backfill is before the last attempt, add a day to proposed backfill so it will be after the last attempt
	if lastBackfillAttemptTime.Sub(validCreationTime) > 0 {
		validCreationTime = validCreationTime.AddDate(0, 0, 1)
	}

	return api.countNumberOfTasksToCreate(0, 0, 1, false, currentTime, validCreationTime)
}

func (api *API) countTasksToCreateForWeekDailyTemplate(currentTime time.Time, lastBackfillAttemptTime time.Time, validCreationTime time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	// check if backfill time is before or after last backfill attempt
	// backfill time is based upon last attempt time (it should be same day as the last attempt)
	// if proposed backfill is before the last attempt, add a day to proposed backfill so it will be after the last attempt
	if lastBackfillAttemptTime.Sub(validCreationTime) > 0 {
		validCreationTime = validCreationTime.AddDate(0, 0, 1)
	}

	return api.countNumberOfTasksToCreate(0, 0, 1, true, currentTime, validCreationTime)
}

func (api *API) countTasksToCreateForWeeklyTemplate(currentTime time.Time, lastBackfillAttemptTime time.Time, validCreationTime time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	// check if backfill time is before or after last backfill attempt
	if lastBackfillAttemptTime.Sub(validCreationTime) > 0 {
		validCreationTime = validCreationTime.AddDate(0, 0, 1)
	}
	// continue adding days until the weekday matches the day of the week which the trigger is
	for int(validCreationTime.Weekday()) != *template.DayToCreateTask {
		validCreationTime = validCreationTime.AddDate(0, 0, 1)
	}

	return api.countNumberOfTasksToCreate(0, 0, 7, false, currentTime, validCreationTime)
}

func (api *API) countTasksToCreateForMonthlyTemplate(currentTime time.Time, lastBackfillAttemptTime time.Time, validCreationTime time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	// check if backfill time is before or after last backfill attempt
	// backfill time is based upon last attempt time (it should be same day as the last attempt)
	// if proposed backfill is before the last attempt, add a month to proposed backfill so it will be after the last attempt
	if lastBackfillAttemptTime.Sub(validCreationTime) > 0 {
		validCreationTime = validCreationTime.AddDate(0, 1, 0)
	}

	return api.countNumberOfTasksToCreate(0, 1, 0, false, currentTime, validCreationTime)
}

func (api *API) countTasksToCreateForAnnualTemplate(currentTime time.Time, lastBackfillAttemptTime time.Time, validCreationTime time.Time, template database.RecurringTaskTemplate, localZone *time.Location) int {
	// check if backfill time is before or after last backfill attempt
	// backfill time is based upon last attempt time (it should be same day as the last attempt)
	// if proposed backfill is before the last attempt, add a year to proposed backfill so it will be after the last attempt
	if lastBackfillAttemptTime.Sub(validCreationTime) > 0 {
		validCreationTime = validCreationTime.AddDate(1, 0, 0)
	}

	return api.countNumberOfTasksToCreate(1, 0, 0, false, currentTime, validCreationTime)
}

func (api *API) createTaskFromTemplate(template database.RecurringTaskTemplate) database.Task {
	completed := false

	// TODO calculate time when this task should have been created for CreatedAt and UpdatedAt
	return database.Task{
		UserID:                  template.UserID,
		RecurringTaskTemplateID: template.ID,
		SourceID:                external.TASK_SOURCE_ID_GT_TASK,
		Title:                   template.Title,
		Body:                    template.Body,
		IDTaskSection:           template.IDTaskSection,
		PriorityNormalized:      template.PriorityNormalized,
		IsCompleted:             &completed,
		CreatedAtExternal:       primitive.NewDateTimeFromTime(time.Now()),
		UpdatedAt:               primitive.NewDateTimeFromTime(time.Now()),
	}
}
