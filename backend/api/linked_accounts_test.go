package api

import (
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"strings"
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
		authToken := login("approved@generaltask.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/linked_accounts/supported_types/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.True(t, strings.Contains(string(body), "{\"name\":\"Google\",\"logo\":\"/images/gmail.svg\",\"authorization_url\":\"http://localhost:8080/link/google/\"}"))
		assert.Equal(t, 1, strings.Count(string(body), "{\"name\":\"Slack\",\"logo\":\"/images/slack.svg\",\"authorization_url\":\"http://localhost:8080/link/slack/\"}"))
	})
	UnauthorizedTest(t, "GET", "/linked_accounts/supported_types/", nil)
}

func TestLinkedAccountsList(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	t.Run("SuccessOnlyGoogle", func(t *testing.T) {
		authToken := login("linkedaccounts@generaltask.com", "")
		createGoogleLink(t, api.DB, authToken, "linkedaccounts@generaltask.com", false).Hex()
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		googleTokenID := getGoogleTokenFromAuthToken(t, api.DB, authToken).ID.Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts@generaltask.com\",\"name\":\"Google\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_unlinkable\":false,\"has_bad_token\":false}]", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("linkedaccounts2@generaltask.com", "")
		createGoogleLink(t, api.DB, authToken, "linkedaccounts2@generaltask.com", false).Hex()
		linearTokenID := insertLinearToken(t, api.DB, authToken).Hex()
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		googleTokenID := getGoogleTokenFromAuthToken(t, api.DB, authToken).ID.Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts2@generaltask.com\",\"name\":\"Google\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_unlinkable\":false,\"has_bad_token\":false},{\"id\":\""+linearTokenID+"\",\"display_id\":\"Linear\",\"name\":\"Linear\",\"logo\":\"/images/linear.png\",\"logo_v2\":\"linear\",\"is_unlinkable\":true,\"has_bad_token\":false}]", string(body))

	})

	t.Run("SuccessWithBadToken", func(t *testing.T) {
		authToken := login("linkedaccounts3@generaltask.com", "")
		createGoogleLink(t, api.DB, authToken, "linkedaccounts3@generaltask.com", true).Hex()
		linearTokenID := insertLinearToken(t, api.DB, authToken).Hex()

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		googleTokenID := getGoogleTokenFromAuthToken(t, api.DB, authToken).ID.Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts3@generaltask.com\",\"name\":\"Google\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_unlinkable\":false,\"has_bad_token\":true},{\"id\":\""+linearTokenID+"\",\"display_id\":\"Linear\",\"name\":\"Linear\",\"logo\":\"/images/linear.png\",\"logo_v2\":\"linear\",\"is_unlinkable\":true,\"has_bad_token\":false}]", string(body))
	})
	UnauthorizedTest(t, "GET", "/linked_accounts/", nil)
}

func TestDeleteLinkedAccount(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	t.Run("MalformattedAccountID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		createGoogleLink(t, api.DB, authToken, "approved@generaltask.com", false).Hex()
		router := GetRouter(api)
		request, _ := http.NewRequest("DELETE", "/linked_accounts/123/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("InvalidAccountID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		createGoogleLink(t, api.DB, authToken, "approved@generaltask.com", false).Hex()
		router := GetRouter(api)
		request, _ := http.NewRequest("DELETE", "/linked_accounts/"+primitive.NewObjectID().Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("UnlinkableAccount", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		createGoogleLink(t, api.DB, authToken, "approved@generaltask.com", false).Hex()
		googleAccountID := getGoogleTokenFromAuthToken(t, api.DB, authToken).ID
		router := GetRouter(api)
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
		authToken := login("approved@generaltask.com", "")
		createGoogleLink(t, api.DB, authToken, "approved@generaltask.com", false).Hex()
		authTokenOther := login("other@generaltask.com", "")
		createGoogleLink(t, api.DB, authTokenOther, "other@generaltask.com", false).Hex()
		googleAccountID := getGoogleTokenFromAuthToken(t, api.DB, authTokenOther).ID
		router := GetRouter(api)
		request, _ := http.NewRequest("DELETE", "/linked_accounts/"+googleAccountID.Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("deletelinkedaccount@generaltask.com", "")
		linearTokenID := insertLinearToken(t, api.DB, authToken)
		router := GetRouter(api)
		request, _ := http.NewRequest("DELETE", "/linked_accounts/"+linearTokenID.Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		var token database.ExternalAPIToken
		err := database.GetExternalTokenCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": linearTokenID},
		).Decode(&token)
		// assert token is not found in db anymore
		assert.Error(t, err)
	})
	UnauthorizedTest(t, "DELETE", "/linked_accounts/123/", nil)
}

func createGoogleLink(t *testing.T, db *mongo.Database, authToken string, email string, isBadToken bool) primitive.ObjectID {
	res, err := database.GetExternalTokenCollection(db).InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			ServiceID:    external.TASK_SERVICE_ID_GOOGLE,
			UserID:       getUserIDFromAuthToken(t, db, authToken),
			DisplayID:    email,
			IsUnlinkable: false,
			IsBadToken:   isBadToken,
		},
	)
	assert.NoError(t, err)
	return res.InsertedID.(primitive.ObjectID)
}

func insertLinearToken(t *testing.T, db *mongo.Database, authToken string) primitive.ObjectID {
	res, err := database.GetExternalTokenCollection(db).InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			ServiceID:    external.TASK_SERVICE_ID_LINEAR,
			UserID:       getUserIDFromAuthToken(t, db, authToken),
			DisplayID:    "Linear",
			IsUnlinkable: true,
		},
	)
	assert.NoError(t, err)
	return res.InsertedID.(primitive.ObjectID)
}
