package api

import (
	"bytes"
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestSettingsGet(t *testing.T) {
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	settingCollection := db.Collection("user_settings")

	t.Run("DefaultValue", func(t *testing.T) {
		// Random userID; should be ignored
		_, err := settingCollection.InsertOne(context.TODO(), &database.UserSetting{
			UserID:     primitive.NewObjectID(),
			FieldKey:   SettingFieldEmailDonePreference,
			FieldValue: ChoiceKeyMarkAsRead,
		})
		assert.NoError(t, err)

		authToken := login("approved@generaltask.io")
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/settings/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "[{\"field_key\":\"email_done_preference\",\"field_name\":\"'Done' action for emails\",\"choices\":[{\"choice_key\":\"archive\",\"choice_name\":\"Archive\"},{\"choice_key\":\"mark_as_read\",\"choice_name\":\"Mark as read\"}],\"field_value\":\"archive\"}]", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("approved@generaltask.io")
		userID := getUserIDFromAuthToken(t, db, authToken)

		_, err := settingCollection.InsertOne(context.TODO(), &database.UserSetting{
			UserID:     userID,
			FieldKey:   SettingFieldEmailDonePreference,
			FieldValue: ChoiceKeyMarkAsRead,
		})
		assert.NoError(t, err)

		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/settings/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "[{\"field_key\":\"email_done_preference\",\"field_name\":\"'Done' action for emails\",\"choices\":[{\"choice_key\":\"archive\",\"choice_name\":\"Archive\"},{\"choice_key\":\"mark_as_read\",\"choice_name\":\"Mark as read\"}],\"field_value\":\"mark_as_read\"}]", string(body))
	})
	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/settings/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
}

func TestSettingsModify(t *testing.T) {
	t.Run("EmptyPayload", func(t *testing.T) {
		authToken := login("approved@generaltask.io")
		router := GetRouter(&API{})
		request, _ := http.NewRequest("PATCH", "/settings/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"Parameters missing or malformatted.\"}", string(body))
	})
	t.Run("InvalidPayload", func(t *testing.T) {
		authToken := login("approved@generaltask.io")
		router := GetRouter(&API{})
		request, _ := http.NewRequest(
			"PATCH",
			"/settings/",
			bytes.NewBuffer([]byte(`["not", "a", "map"]`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"Parameters missing or malformatted.\"}", string(body))
	})
	t.Run("BadKey", func(t *testing.T) {
		authToken := login("approved@generaltask.io")
		router := GetRouter(&API{})
		request, _ := http.NewRequest(
			"PATCH",
			"/settings/",
			bytes.NewBuffer([]byte(`{"dogecoin": "tothemoon"}`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"Failed to update settings: invalid setting: dogecoin\"}", string(body))
	})
	t.Run("BadValue", func(t *testing.T) {
		authToken := login("approved@generaltask.io")
		router := GetRouter(&API{})
		request, _ := http.NewRequest(
			"PATCH",
			"/settings/",
			bytes.NewBuffer([]byte(`{"email_done_preference": "tothemoon"}`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"Failed to update settings: invalid value: tothemoon\"}", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("approved@generaltask.io")
		router := GetRouter(&API{})
		request, _ := http.NewRequest(
			"PATCH",
			"/settings/",
			bytes.NewBuffer([]byte(`{"email_done_preference": "mark_as_read"}`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		db, dbCleanup := database.GetDBConnection()
		defer dbCleanup()
		userID := getUserIDFromAuthToken(t, db, authToken)
		assert.Equal(t, ChoiceKeyMarkAsRead, GetUserSetting(db, userID, SettingFieldEmailDonePreference))
	})
	t.Run("Unauthorized", func(t *testing.T) {})
}
