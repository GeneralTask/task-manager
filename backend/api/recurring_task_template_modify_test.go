package api

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestRecurringTaskTemplateModify(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("template_modify@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	api, dbCleanup := GetAPIWithDBCleanup()
	currentTime := time.Now()
	api.OverrideTime = &currentTime
	defer dbCleanup()
	router := GetRouter(api)

	title := "hello!"
	enabled := true
	deleted := false
	templateCollection := database.GetRecurringTaskTemplateCollection(api.DB)
	insertResult, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
		UserID:    userID,
		Title:     &title,
		IsEnabled: &enabled,
		IsDeleted: &deleted,
	})

	templateID := insertResult.InsertedID.(primitive.ObjectID)

	t.Run("NoUser", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/recurring_task_templates/modify/"+templateID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"title": "new title!"}`)),
		)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
	t.Run("WrongTask", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/recurring_task_templates/modify/"+primitive.NewObjectID().Hex()+"/",
			bytes.NewBuffer([]byte(`{"title": "new title!"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("TaskSectionInvalid", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/recurring_task_templates/modify/"+templateID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"id_task_section": "invalid!"}`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})
	t.Run("MalformattedParam", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/recurring_task_templates/modify/"+templateID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"is_enabled": "malformatted!"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})
	t.Run("Success", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/recurring_task_templates/modify/"+templateID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"title": "new title!", "replace_existing": true}`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		var templates []database.RecurringTaskTemplate
		err = database.FindWithCollection(database.GetRecurringTaskTemplateCollection(api.DB), userID, &[]bson.M{{"is_deleted": false}}, &templates, nil)
		assert.NoError(t, err)
		assert.Equal(t, "new title!", *(templates[0].Title))
		assert.True(t, *templates[0].ReplaceExisting)
		assert.Equal(t, primitive.NewDateTimeFromTime(currentTime), templates[0].UpdatedAt)
	})
	t.Run("Delete", func(t *testing.T) {
		template2Title := "whats up!"
		insertResult, err := templateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
			UserID:    userID,
			Title:     &template2Title,
			IsEnabled: &enabled,
			IsDeleted: &deleted,
		})
		assert.NoError(t, err)

		template2ID := insertResult.InsertedID.(primitive.ObjectID)

		taskCollection := database.GetTaskCollection(api.DB)

		createRecurringTask := func(recurringTaskTemplateID primitive.ObjectID) primitive.ObjectID {
			insertResult, err := taskCollection.InsertOne(context.Background(), database.Task{
				UserID:                  userID,
				RecurringTaskTemplateID: recurringTaskTemplateID,
			})
			assert.NoError(t, err)
			return insertResult.InsertedID.(primitive.ObjectID)
		}
		task1ID := createRecurringTask(templateID)
		task2ID := createRecurringTask(templateID)
		task3ID := createRecurringTask(template2ID)
		task4ID := createRecurringTask(template2ID)

		request, _ := http.NewRequest(
			"PATCH",
			"/recurring_task_templates/modify/"+template2ID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"is_deleted": true, "replace_existing": true}`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		// check that template is deleted
		var template database.RecurringTaskTemplate
		templateCollection.FindOne(context.Background(), bson.M{"_id": template2ID}).Decode(&template)
		assert.True(t, *template.IsDeleted)

		// check that task recurring task template IDs are correct
		task1, err := database.GetTask(api.DB, task1ID, userID)
		assert.NoError(t, err)
		task2, err := database.GetTask(api.DB, task2ID, userID)
		assert.NoError(t, err)
		task3, err := database.GetTask(api.DB, task3ID, userID)
		assert.NoError(t, err)
		task4, err := database.GetTask(api.DB, task4ID, userID)
		assert.NoError(t, err)

		assert.Equal(t, task1.RecurringTaskTemplateID, templateID)
		assert.Equal(t, task2.RecurringTaskTemplateID, templateID)
		assert.Equal(t, task3.RecurringTaskTemplateID, primitive.NilObjectID)
		assert.Equal(t, task4.RecurringTaskTemplateID, primitive.NilObjectID)
	})
}
