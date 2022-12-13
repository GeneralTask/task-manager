package api

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestRecurringTaskTemplateCreate(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("template_create@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	api, dbCleanup := GetAPIWithDBCleanup()
	currentTime := time.Now()
	api.OverrideTime = &currentTime
	defer dbCleanup()
	router := GetRouter(api)

	t.Run("NoUser", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/recurring_task_templates/create/",
			nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
	t.Run("TaskSectionInvalid", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/recurring_task_templates/create/",
			bytes.NewBuffer([]byte(`{"id_task_section": "invalid!"}`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})
	t.Run("MalformattedParam", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/recurring_task_templates/create/",
			bytes.NewBuffer([]byte(`{"recurrence_rate": "malformatted!"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})
	t.Run("NotAllFields", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/recurring_task_templates/create/",
			bytes.NewBuffer([]byte(`{"title": "hello!"}`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})
	t.Run("Success", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/recurring_task_templates/create/",
			bytes.NewBuffer([]byte(`{"title": "hello!", "recurrence_rate": 0, "time_of_day_seconds_to_create_task": 0}`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		var templates []database.RecurringTaskTemplate
		err = database.FindWithCollection(database.GetRecurringTaskTemplateCollection(api.DB), userID, &[]bson.M{{"is_deleted": false}}, &templates, nil)
		assert.NoError(t, err)
		assert.Equal(t, "hello!", *(templates[0].Title))
		assert.Equal(t, primitive.NewDateTimeFromTime(currentTime), templates[0].CreatedAt)
	})
}
