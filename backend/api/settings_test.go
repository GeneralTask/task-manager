package api

import (
	"bytes"
	"context"
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
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	settingCollection := database.GetUserSettingsCollection(api.DB)

	UnauthorizedTest(t, "GET", "/settings/", nil)
	t.Run("DefaultValue", func(t *testing.T) {
		// Random userID; should be ignored
		_, err := settingCollection.InsertOne(context.Background(), &database.UserSetting{
			UserID:     primitive.NewObjectID(),
			FieldKey:   constants.SettingFieldGithubFilteringPreference,
			FieldValue: constants.ChoiceKeyActionableOnly,
		})
		assert.NoError(t, err)

		authToken := login("approved@generaltask.com", "")

		responseBody := ServeRequest(t, authToken, "GET", "/settings/", nil, http.StatusOK, api)
		assert.Contains(t, string(responseBody), "{\"field_key\":\"github_filtering_preference\",\"field_name\":\"\",\"choices\":[{\"choice_key\":\"actionable_only\",\"choice_name\":\"\"},{\"choice_key\":\"all_prs\",\"choice_name\":\"\"}],\"field_value\":\"actionable_only\"}")
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		_, err := settingCollection.InsertOne(context.Background(), &database.UserSetting{
			UserID:     userID,
			FieldKey:   constants.SettingFieldGithubFilteringPreference,
			FieldValue: constants.ChoiceKeyActionableOnly,
		})
		assert.NoError(t, err)

		responseBody := ServeRequest(t, authToken, "GET", "/settings/", nil, http.StatusOK, api)
		assert.Contains(t, string(responseBody), "{\"field_key\":\"github_filtering_preference\",\"field_name\":\"\",\"choices\":[{\"choice_key\":\"actionable_only\",\"choice_name\":\"\"},{\"choice_key\":\"all_prs\",\"choice_name\":\"\"}],\"field_value\":\"actionable_only\"}")
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
	authToken := login("approved@generaltask.com", "")

	t.Run("EmptyPayload", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "PATCH", "/settings/", nil, http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"parameters missing or malformatted.\"}", string(responseBody))
	})
	t.Run("InvalidPayload", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "PATCH", "/settings/", bytes.NewBuffer([]byte(`["not", "a", "map"]`)), http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"parameters missing or malformatted.\"}", string(responseBody))
	})
	t.Run("BadKey", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "PATCH", "/settings/", bytes.NewBuffer([]byte(`{"dogecoin": "tothemoon"}`)), http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"failed to update settings: invalid setting: dogecoin\"}", string(responseBody))
	})
	t.Run("BadValue", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "PATCH", "/settings/", bytes.NewBuffer([]byte(`{"github_filtering_preference": "tothemoon"}`)), http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"failed to update settings: invalid value: tothemoon\"}", string(responseBody))
	})
	t.Run("Success", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "PATCH", "/settings/", bytes.NewBuffer([]byte(`{"github_filtering_preference": "all_prs"}`)), http.StatusOK, nil)
		assert.Equal(t, "{}", string(responseBody))

		responseBody = ServeRequest(t, authToken, "GET", "/settings/", nil, http.StatusOK, nil)
		assert.Contains(t, string(responseBody), "{\"field_key\":\"github_filtering_preference\",\"field_name\":\"\",\"choices\":[{\"choice_key\":\"actionable_only\",\"choice_name\":\"\"},{\"choice_key\":\"all_prs\",\"choice_name\":\"\"}],\"field_value\":\"all_prs\"}")
	})
	t.Run("SuccessAlreadyExists", func(t *testing.T) {
		authToken := login("approved2@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)
		settings.UpdateUserSetting(db, userID, constants.SettingFieldGithubFilteringPreference, constants.ChoiceKeyActionableOnly)

		responseBody := ServeRequest(t, authToken, "PATCH", "/settings/", bytes.NewBuffer([]byte(`{"github_filtering_preference": "all_prs"}`)), http.StatusOK, nil)
		assert.Equal(t, "{}", string(responseBody))

		responseBody = ServeRequest(t, authToken, "GET", "/settings/", nil, http.StatusOK, nil)
		assert.Contains(t, string(responseBody), "{\"field_key\":\"github_filtering_preference\",\"field_name\":\"\",\"choices\":[{\"choice_key\":\"actionable_only\",\"choice_name\":\"\"},{\"choice_key\":\"all_prs\",\"choice_name\":\"\"}],\"field_value\":\"all_prs\"}")
	})
}
