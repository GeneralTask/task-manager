package api

import (
	"bytes"
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/settings"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestSettingsGet(t *testing.T) {
	parentCtx := context.Background()
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	settingCollection := database.GetUserSettingsCollection(api.DB)

	UnauthorizedTest(t, "GET", "/settings/", nil)
	t.Run("DefaultValue", func(t *testing.T) {
		// Random userID; should be ignored
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		_, err := settingCollection.InsertOne(dbCtx, &database.UserSetting{
			UserID:     primitive.NewObjectID(),
			FieldKey:   settings.SettingFieldGithubFilteringPreference,
			FieldValue: settings.ChoiceKeyActionableOnly,
		})
		assert.NoError(t, err)

		authToken := login("approved@generaltask.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/settings/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Contains(t, string(body), "{\"field_key\":\"github_filtering_preference\",\"field_name\":\"\",\"choices\":[{\"choice_key\":\"actionable_only\",\"choice_name\":\"\"},{\"choice_key\":\"all_prs\",\"choice_name\":\"\"}],\"field_value\":\"actionable_only\"}")
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		_, err := settingCollection.InsertOne(dbCtx, &database.UserSetting{
			UserID:     userID,
			FieldKey:   settings.SettingFieldGithubFilteringPreference,
			FieldValue: settings.ChoiceKeyActionableOnly,
		})
		assert.NoError(t, err)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/settings/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Contains(t, string(body), "{\"field_key\":\"github_filtering_preference\",\"field_name\":\"\",\"choices\":[{\"choice_key\":\"actionable_only\",\"choice_name\":\"\"},{\"choice_key\":\"all_prs\",\"choice_name\":\"\"}],\"field_value\":\"actionable_only\"}")
	})
	UnauthorizedTest(t, "GET", "/settings/", nil)
	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/settings/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
}

func TestSettingsModify(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	t.Run("EmptyPayload", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("PATCH", "/settings/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"parameters missing or malformatted.\"}", string(body))
	})
	t.Run("InvalidPayload", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
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
		assert.Equal(t, "{\"detail\":\"parameters missing or malformatted.\"}", string(body))
	})
	t.Run("BadKey", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
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
		assert.Equal(t, "{\"detail\":\"failed to update settings: invalid setting: dogecoin\"}", string(body))
	})
	t.Run("BadValue", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/settings/",
			bytes.NewBuffer([]byte(`{"github_filtering_preference": "tothemoon"}`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"failed to update settings: invalid value: tothemoon\"}", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/settings/",
			bytes.NewBuffer([]byte(`{"github_filtering_preference": "all_prs"}`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		userID := getUserIDFromAuthToken(t, db, authToken)
		setting, err := settings.GetUserSetting(db, userID, settings.SettingFieldGithubFilteringPreference)
		assert.NoError(t, err)
		assert.Equal(t, settings.ChoiceKeyAllPRs, *setting)
	})
	t.Run("SuccessAlreadyExists", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)
		settings.UpdateUserSetting(db, userID, settings.SettingFieldGithubFilteringPreference, settings.ChoiceKeyActionableOnly)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/settings/",
			bytes.NewBuffer([]byte(`{"github_filtering_preference": "all_prs"}`)),
		)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		setting, err := settings.GetUserSetting(db, userID, settings.SettingFieldGithubFilteringPreference)
		assert.NoError(t, err)
		assert.Equal(t, settings.ChoiceKeyAllPRs, *setting)
	})
}
