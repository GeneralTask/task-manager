package api

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestRecurringTaskTemplateListV2(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("template_list@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	templateCollection := database.GetRecurringTaskTemplateCollection(db)
	title := "recurring task!"
	priority := 3.0
	_true := true
	_false := false
	rate := 0
	triggerTime := time.Now()

	createdAt := time.Now()
	createdAt2 := createdAt.Add(time.Hour)
	createdAt3 := createdAt.Add(-time.Hour)

	// enabled and not deleted
	template1Result, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
		UserID:               userID,
		Title:                &title,
		PriorityNormalized:   &priority,
		IsEnabled:            &_true,
		IsDeleted:            &_false,
		RecurrenceRate:       &rate,
		LastBackfillDatetime: primitive.NewDateTimeFromTime(triggerTime),
		CreatedAt:            primitive.NewDateTimeFromTime(createdAt2),
		UpdatedAt:            primitive.NewDateTimeFromTime(createdAt2),
	})
	assert.NoError(t, err)

	// not deleted, not enabled
	template2Result, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
		UserID:               userID,
		Title:                &title,
		PriorityNormalized:   &priority,
		IsEnabled:            &_false,
		IsDeleted:            &_false,
		RecurrenceRate:       &rate,
		LastBackfillDatetime: primitive.NewDateTimeFromTime(triggerTime),
		CreatedAt:            primitive.NewDateTimeFromTime(createdAt),
		UpdatedAt:            primitive.NewDateTimeFromTime(createdAt),
	})
	assert.NoError(t, err)

	// enabled and deleted
	template3Result, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
		UserID:               userID,
		Title:                &title,
		PriorityNormalized:   &priority,
		IsEnabled:            &_true,
		IsDeleted:            &_true,
		RecurrenceRate:       &rate,
		LastBackfillDatetime: primitive.NewDateTimeFromTime(triggerTime),
		CreatedAt:            primitive.NewDateTimeFromTime(createdAt3),
		UpdatedAt:            primitive.NewDateTimeFromTime(createdAt3),
	})
	assert.NoError(t, err)

	// wrong user ID
	_, err = templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
		UserID:               primitive.NewObjectID(),
		Title:                &title,
		PriorityNormalized:   &priority,
		IsEnabled:            &_true,
		IsDeleted:            &_false,
		RecurrenceRate:       &rate,
		LastBackfillDatetime: primitive.NewDateTimeFromTime(triggerTime),
	})
	assert.NoError(t, err)

	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	t.Run("NoUser", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			"/recurring_task_templates/",
			nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
	t.Run("Success", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			"/recurring_task_templates/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)

		assert.Equal(t,
			fmt.Sprintf(`[{"id":"%s","user_id":"%s","title":"recurring task!","id_task_section":"000000000000000000000000","priority_normalized":3,"is_enabled":true,"is_deleted":false,"recurrence_rate":0,"last_backfill_datetime":"%s","created_at":"%s","updated_at":"%s"},{"id":"%s","user_id":"%s","title":"recurring task!","id_task_section":"000000000000000000000000","priority_normalized":3,"is_enabled":false,"is_deleted":false,"recurrence_rate":0,"last_backfill_datetime":"%s","created_at":"%s","updated_at":"%s"},{"id":"%s","user_id":"%s","title":"recurring task!","id_task_section":"000000000000000000000000","priority_normalized":3,"is_enabled":true,"is_deleted":true,"recurrence_rate":0,"last_backfill_datetime":"%s","created_at":"%s","updated_at":"%s"}]`, template1Result.InsertedID.(primitive.ObjectID).Hex(), userID.Hex(), triggerTime.Format("2006-01-02T15:04:05.999Z07:00"), createdAt2.Format("2006-01-02T15:04:05.999Z07:00"), createdAt2.Format("2006-01-02T15:04:05.999Z07:00"), template2Result.InsertedID.(primitive.ObjectID).Hex(), userID.Hex(), triggerTime.Format("2006-01-02T15:04:05.999Z07:00"), createdAt.Format("2006-01-02T15:04:05.999Z07:00"), createdAt.Format("2006-01-02T15:04:05.999Z07:00"), template3Result.InsertedID.(primitive.ObjectID).Hex(), userID.Hex(), triggerTime.Format("2006-01-02T15:04:05.999Z07:00"), createdAt3.Format("2006-01-02T15:04:05.999Z07:00"), createdAt3.Format("2006-01-02T15:04:05.999Z07:00")),
			string(body))
	})
}
