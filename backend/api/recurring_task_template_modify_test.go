package api

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

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
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})
	t.Run("Success", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/recurring_task_templates/modify/"+templateID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"title": "new title!"}`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		var templates []database.RecurringTaskTemplate
		err = database.FindWithCollection(database.GetRecurringTaskTemplateCollection(api.DB), userID, &[]bson.M{{"is_deleted": false}}, &templates, nil)
		assert.NoError(t, err)
		assert.Equal(t, "new title!", *(templates[0].Title))
	})
}
