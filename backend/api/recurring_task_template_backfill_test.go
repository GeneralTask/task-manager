package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestRecurringTaskTemplateBackfill(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	// 10:10:10 on Tuesday November 15, 2022
	// will replace current time in tests
	overrideDate := time.Date(2022, time.November, 15, 10, 10, 10, 0, time.UTC)
	api.OverrideTime = &overrideDate

	t.Run("DailyTest", func(t *testing.T) {
		authToken := login("daily_recur@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		title := "hello!"
		enabled := true
		deleted := false
		recurrenceRate := Daily

		// 10:00:10
		creationTimeSeconds := 60*60*10 + 60*0 + 10

		// last backfill time before creation time
		// same date as override, just a little earlier
		lastBackfillTime := time.Date(2022, time.November, 15, 9, 0, 0, 0, time.UTC)

		templateCollection := database.GetRecurringTaskTemplateCollection(api.DB)
		insertResult, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
			UserID:                       userID,
			Title:                        &title,
			IsEnabled:                    &enabled,
			IsDeleted:                    &deleted,
			RecurrenceRate:               &recurrenceRate,
			TimeOfDaySecondsToCreateTask: &creationTimeSeconds,
			LastBackfillDatetime:         primitive.NewDateTimeFromTime(lastBackfillTime),
		})
		templateID := insertResult.InsertedID.(primitive.ObjectID)
		assert.NoError(t, err)

		request, _ := http.NewRequest(
			"GET",
			"/recurring_task_templates/backfill_tasks/",
			nil,
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Set("Timezone-Offset", "0")
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		tasks, err := database.GetActiveTasks(api.DB, userID)
		assert.NoError(t, err)
		assert.Equal(t, 5, len(*tasks))
		assert.Equal(t, templateID, (*tasks)[4].RecurringTaskTemplateID)
	})
	t.Run("WeekDailyTest", func(t *testing.T) {
		authToken := login("week_daily_recur@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		title := "hello!"
		enabled := true
		deleted := false
		recurrenceRate := WeekDaily

		// 11:00:10
		creationTimeSeconds := 60*60*11 + 60*0 + 10

		// Sunday before creation time
		// should still only show 1 creation
		lastBackfillTime := time.Date(2022, time.November, 13, 9, 0, 0, 0, time.UTC)

		templateCollection := database.GetRecurringTaskTemplateCollection(api.DB)
		insertResult, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
			UserID:                       userID,
			Title:                        &title,
			IsEnabled:                    &enabled,
			IsDeleted:                    &deleted,
			RecurrenceRate:               &recurrenceRate,
			TimeOfDaySecondsToCreateTask: &creationTimeSeconds,
			LastBackfillDatetime:         primitive.NewDateTimeFromTime(lastBackfillTime),
		})
		templateID := insertResult.InsertedID.(primitive.ObjectID)
		assert.NoError(t, err)

		request, _ := http.NewRequest(
			"GET",
			"/recurring_task_templates/backfill_tasks/",
			nil,
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Set("Timezone-Offset", "0")
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		tasks, err := database.GetActiveTasks(api.DB, userID)
		assert.NoError(t, err)
		assert.Equal(t, 5, len(*tasks))
		assert.Equal(t, templateID, (*tasks)[4].RecurringTaskTemplateID)
	})
	t.Run("WeeklyTest", func(t *testing.T) {
		authToken := login("weekly_recur@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		title := "hello!"
		enabled := true
		deleted := false
		recurrenceRate := Weekly
		// 10:00:10
		creationTimeSeconds := 60*60*10 + 60*0 + 10
		creationDay := int(time.Monday)

		// last backfill time before creation time
		// Sunday November 6 (2 periods should pass)
		lastBackfillTime := time.Date(2022, time.November, 6, 9, 0, 0, 0, time.UTC)

		templateCollection := database.GetRecurringTaskTemplateCollection(api.DB)
		insertResult, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
			UserID:                       userID,
			Title:                        &title,
			IsEnabled:                    &enabled,
			IsDeleted:                    &deleted,
			RecurrenceRate:               &recurrenceRate,
			TimeOfDaySecondsToCreateTask: &creationTimeSeconds,
			DayToCreateTask:              &creationDay,
			LastBackfillDatetime:         primitive.NewDateTimeFromTime(lastBackfillTime),
		})
		templateID := insertResult.InsertedID.(primitive.ObjectID)
		assert.NoError(t, err)

		request, _ := http.NewRequest(
			"GET",
			"/recurring_task_templates/backfill_tasks/",
			nil,
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Set("Timezone-Offset", "0")
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		tasks, err := database.GetActiveTasks(api.DB, userID)
		assert.NoError(t, err)
		assert.Equal(t, 6, len(*tasks))
		assert.Equal(t, templateID, (*tasks)[4].RecurringTaskTemplateID)
	})
	t.Run("MonthlyTest", func(t *testing.T) {
		authToken := login("monthly_recur@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		title := "hello!"
		enabled := true
		deleted := false
		recurrenceRate := Monthly
		// 10:00:10
		creationTimeSeconds := 60*60*10 + 60*0 + 10
		creationDay := 14

		// November 13 (1 should triger)
		lastBackfillTime := time.Date(2022, time.November, 13, 4, 0, 0, 0, time.UTC)

		templateCollection := database.GetRecurringTaskTemplateCollection(api.DB)
		insertResult, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
			UserID:                       userID,
			Title:                        &title,
			IsEnabled:                    &enabled,
			IsDeleted:                    &deleted,
			RecurrenceRate:               &recurrenceRate,
			TimeOfDaySecondsToCreateTask: &creationTimeSeconds,
			DayToCreateTask:              &creationDay,
			LastBackfillDatetime:         primitive.NewDateTimeFromTime(lastBackfillTime),
		})
		templateID := insertResult.InsertedID.(primitive.ObjectID)
		assert.NoError(t, err)

		request, _ := http.NewRequest(
			"GET",
			"/recurring_task_templates/backfill_tasks/",
			nil,
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Set("Timezone-Offset", "0")
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		tasks, err := database.GetActiveTasks(api.DB, userID)
		assert.NoError(t, err)
		assert.Equal(t, 5, len(*tasks))
		assert.Equal(t, templateID, (*tasks)[4].RecurringTaskTemplateID)
	})
	t.Run("YearlyTest", func(t *testing.T) {
		authToken := login("yearly_recur@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		title := "hello!"
		enabled := true
		deleted := false
		recurrenceRate := Annually
		// 10:00:10
		creationTimeSeconds := 60*60*10 + 60*0 + 10
		creationDay := 14
		creationMonth := 11

		// September 12, 2021
		// Should have 2 triggers by this time
		lastBackfillTime := time.Date(2021, time.September, 12, 9, 0, 0, 0, time.UTC)

		templateCollection := database.GetRecurringTaskTemplateCollection(api.DB)
		insertResult, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
			UserID:                       userID,
			Title:                        &title,
			IsEnabled:                    &enabled,
			IsDeleted:                    &deleted,
			RecurrenceRate:               &recurrenceRate,
			TimeOfDaySecondsToCreateTask: &creationTimeSeconds,
			DayToCreateTask:              &creationDay,
			MonthToCreateTask:            &creationMonth,
			LastBackfillDatetime:         primitive.NewDateTimeFromTime(lastBackfillTime),
		})
		templateID := insertResult.InsertedID.(primitive.ObjectID)
		assert.NoError(t, err)

		request, _ := http.NewRequest(
			"GET",
			"/recurring_task_templates/backfill_tasks/",
			nil,
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Set("Timezone-Offset", "0")
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		tasks, err := database.GetActiveTasks(api.DB, userID)
		assert.NoError(t, err)
		assert.Equal(t, 6, len(*tasks))
		assert.Equal(t, templateID, (*tasks)[4].RecurringTaskTemplateID)
	})
}
