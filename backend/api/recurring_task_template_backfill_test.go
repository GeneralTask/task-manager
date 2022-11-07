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

	t.Run("DailyTest", func(t *testing.T) {
		authToken := login("daily_recur@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		title := "hello!"
		enabled := true
		deleted := false
		recurrenceRate := Daily
		creationTimeSeconds := 60*60*time.Now().Hour() + 60*time.Now().Minute() + time.Now().Second() + 120

		templateCollection := database.GetRecurringTaskTemplateCollection(api.DB)
		insertResult, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
			UserID:               userID,
			Title:                &title,
			IsEnabled:            &enabled,
			IsDeleted:            &deleted,
			RecurrenceRate:       &recurrenceRate,
			CreationTimeSeconds:  &creationTimeSeconds,
			LastBackfillDatetime: primitive.NewDateTimeFromTime(time.Now().Add(-24 * time.Hour)),
		})
		templateID := insertResult.InsertedID.(primitive.ObjectID)
		assert.NoError(t, err)

		request, _ := http.NewRequest(
			"GET",
			"/recurring_task_templates/backfill/",
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
		creationTimeSeconds := 60*60*time.Now().Hour() + 60*time.Now().Minute() + time.Now().Second() + 120

		templateCollection := database.GetRecurringTaskTemplateCollection(api.DB)

		lastTriggered := time.Now().Add(-24 * time.Hour)
		if int(time.Now().Weekday()) == 6 {
			lastTriggered = lastTriggered.Add(-24 & time.Hour)
		}
		if int(time.Now().Weekday()) == 0 {
			lastTriggered = lastTriggered.Add(-48 & time.Hour)
		}

		insertResult, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
			UserID:               userID,
			Title:                &title,
			IsEnabled:            &enabled,
			IsDeleted:            &deleted,
			RecurrenceRate:       &recurrenceRate,
			CreationTimeSeconds:  &creationTimeSeconds,
			LastBackfillDatetime: primitive.NewDateTimeFromTime(lastTriggered),
		})
		templateID := insertResult.InsertedID.(primitive.ObjectID)
		assert.NoError(t, err)

		request, _ := http.NewRequest(
			"GET",
			"/recurring_task_templates/backfill/",
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
		creationTimeSeconds := 60*60*time.Now().Hour() + 60*time.Now().Minute() + time.Now().Second() + 30
		creationDay := int(time.Now().Weekday())

		templateCollection := database.GetRecurringTaskTemplateCollection(api.DB)
		insertResult, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
			UserID:               userID,
			Title:                &title,
			IsEnabled:            &enabled,
			IsDeleted:            &deleted,
			RecurrenceRate:       &recurrenceRate,
			CreationTimeSeconds:  &creationTimeSeconds,
			CreationDay:          &creationDay,
			LastBackfillDatetime: primitive.NewDateTimeFromTime(time.Now().Add(-180 * time.Hour)),
		})
		templateID := insertResult.InsertedID.(primitive.ObjectID)
		assert.NoError(t, err)

		request, _ := http.NewRequest(
			"GET",
			"/recurring_task_templates/backfill/",
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
		creationTimeSeconds := 60*60*time.Now().Hour() + 60*time.Now().Minute() + time.Now().Second() + 30
		creationDay := time.Now().Day()

		templateCollection := database.GetRecurringTaskTemplateCollection(api.DB)
		insertResult, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
			UserID:               userID,
			Title:                &title,
			IsEnabled:            &enabled,
			IsDeleted:            &deleted,
			RecurrenceRate:       &recurrenceRate,
			CreationTimeSeconds:  &creationTimeSeconds,
			CreationDay:          &creationDay,
			LastBackfillDatetime: primitive.NewDateTimeFromTime(time.Now().Add(-12 * time.Hour)),
		})
		templateID := insertResult.InsertedID.(primitive.ObjectID)
		assert.NoError(t, err)

		request, _ := http.NewRequest(
			"GET",
			"/recurring_task_templates/backfill/",
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
		creationTimeSeconds := 60*60*time.Now().Hour() + 60*time.Now().Minute() + time.Now().Second() + 30
		creationDay := time.Now().Day()
		creationMonth := int(time.Now().Month())

		templateCollection := database.GetRecurringTaskTemplateCollection(api.DB)
		insertResult, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
			UserID:               userID,
			Title:                &title,
			IsEnabled:            &enabled,
			IsDeleted:            &deleted,
			RecurrenceRate:       &recurrenceRate,
			CreationTimeSeconds:  &creationTimeSeconds,
			CreationDay:          &creationDay,
			CreationMonth:        &creationMonth,
			LastBackfillDatetime: primitive.NewDateTimeFromTime(time.Now().Add(-12 * time.Hour)),
		})
		templateID := insertResult.InsertedID.(primitive.ObjectID)
		assert.NoError(t, err)

		request, _ := http.NewRequest(
			"GET",
			"/recurring_task_templates/backfill/",
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
}
