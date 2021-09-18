package api

import (
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestSupportedAccountTypesList(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("GET", "/linked_accounts/supported_types/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "[{\"name\":\"JIRA\",\"logo\":\"/images/jira.svg\",\"authorization_url\":\"http://localhost:8080/authorize/atlassian/\"}]", string(body))
	})
	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(GetAPI())
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
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		googleTokenID := getGoogleTokenFromAuthToken(t, db, authToken).ID.Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts@generaltask.io\",\"name\":\"Google\",\"logo\":\"/images/gmail.svg\",\"is_unlinkable\":false}]", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("linkedaccounts2@generaltask.io", "")
		jiraTokenID := createJIRADungeon(t, db, authToken).Hex()
		assert.NoError(t, err)
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		googleTokenID := getGoogleTokenFromAuthToken(t, db, authToken).ID.Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts2@generaltask.io\",\"name\":\"Google\",\"logo\":\"/images/gmail.svg\",\"is_unlinkable\":false},{\"id\":\""+jiraTokenID+"\",\"display_id\":\"Jira dungeon\",\"name\":\"Atlassian\",\"logo\":\"/images/jira.svg\",\"is_unlinkable\":true}]", string(body))
	})
	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
}

func TestDeleteLinkedAccount(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	t.Run("MalformattedAccountID", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("DELETE", "/linked_accounts/123/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("InvalidAccountID", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("DELETE", "/linked_accounts/"+primitive.NewObjectID().Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("UnlinkableAccount", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		googleAccountID := getGoogleTokenFromAuthToken(t, db, authToken).ID
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("DELETE", "/linked_accounts/"+googleAccountID.Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"account is not unlinkable\"}", string(body))
	})
	t.Run("AccountDifferentUser", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		authTokenOther := login("other@generaltask.io", "")
		googleAccountID := getGoogleTokenFromAuthToken(t, db, authTokenOther).ID
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("DELETE", "/linked_accounts/"+googleAccountID.Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("deletelinkedaccount@generaltask.io", "")
		jiraTokenID := createJIRADungeon(t, db, authToken)
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("DELETE", "/linked_accounts/"+jiraTokenID.Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		var token database.ExternalAPIToken
		err := db.Collection("external_api_tokens").FindOne(
			context.TODO(),
			bson.M{"_id": jiraTokenID},
		).Decode(&token)
		// assert token is not found in db anymore
		assert.Error(t, err)
	})
	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("DELETE", "/linked_accounts/123/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
}

func createJIRADungeon(t *testing.T, db *mongo.Database, authToken string) primitive.ObjectID {
	res, err := db.Collection("external_api_tokens").InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			ServiceID:    external.TASK_SERVICE_ID_ATLASSIAN,
			UserID:       getUserIDFromAuthToken(t, db, authToken),
			DisplayID:    "Jira dungeon",
			IsUnlinkable: true,
		},
	)
	assert.NoError(t, err)
	return res.InsertedID.(primitive.ObjectID)
}
