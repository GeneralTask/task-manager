package api

import (
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
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
		googleTokenID := getGoogleTokenFromAuthToken(t, db, authToken).ID.Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts@generaltask.io\",\"name\":\"google\",\"logo\":\"/images/gmail.svg\",\"is_unlinkable\":false}]", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("linkedaccounts2@generaltask.io", "")
		res, err := db.Collection("external_api_tokens").InsertOne(
			context.Background(),
			&database.ExternalAPIToken{
				Source:    database.TaskSourceJIRA.Name,
				UserID:    getUserIDFromAuthToken(t, db, authToken),
				DisplayID: "Jira dungeon",
			},
		)
		assert.NoError(t, err)
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		googleTokenID := getGoogleTokenFromAuthToken(t, db, authToken).ID.Hex()
		jiraTokenID := res.InsertedID.(primitive.ObjectID).Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts2@generaltask.io\",\"name\":\"google\",\"logo\":\"/images/gmail.svg\",\"is_unlinkable\":false},{\"id\":\""+jiraTokenID+"\",\"display_id\":\"Jira dungeon\",\"name\":\"Jira\",\"logo\":\"/images/jira.svg\",\"is_unlinkable\":false}]", string(body))
	})
	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
}
