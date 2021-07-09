package api

import (
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
)

func TestSupportedAccountTypesList(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/linked_accounts/supported_types/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "[{\"name\":\"JIRA\",\"logo\":\"/images/jira.svg\",\"authorization_url\":\"http://localhost:8080/authorize/jira/\"}]", string(body))
	})
	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/linked_accounts/supported_types/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
}

func TestLinkedAccountsList(t *testing.T) {
	t.Run("SuccessOnlyGoogle", func(t *testing.T) {
		authToken := login("linkedaccounts@generaltask.io", "")
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "[{\"id\":\"60e7c5440633d426603c576b\",\"display_id\":\"linkedaccounts@generaltask.io\",\"name\":\"google\",\"logo\":\"/images/gmail.svg\",\"is_unlinkable\":false}]", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		authToken := login("linkedaccounts2@generaltask.io", "")
		db.Collection("external_api_tokens").InsertOne(
			context.Background(),
			&database.ExternalAPIToken{
				Source:    database.TaskSourceJIRA.Name,
				UserID:    getUserIDFromAuthToken(t, db, authToken),
				DisplayID: "Jira dungeon",
			},
		)
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "[{\"id\":\"60e7c5440633d426603c576b\",\"display_id\":\"linkedaccounts@generaltask.io\",\"name\":\"google\",\"logo\":\"/images/gmail.svg\",\"is_unlinkable\":false}]", string(body))
	})
	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
}
