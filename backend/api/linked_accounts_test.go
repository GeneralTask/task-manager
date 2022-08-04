package api

import (
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
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
		router := GetRouter(GetAPI())
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
		authToken := login("linkedaccounts@generaltask.com", "")
		createGoogleLink(t, db, authToken, "linkedaccounts@generaltask.com", false).Hex()
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		googleTokenID := getGoogleTokenFromAuthToken(t, db, authToken).ID.Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts@generaltask.com\",\"name\":\"Google\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_unlinkable\":false,\"has_bad_token\":false}]", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("linkedaccounts2@generaltask.com", "")
		createGoogleLink(t, db, authToken, "linkedaccounts2@generaltask.com", false).Hex()
		linearTokenID := insertLinearToken(t, db, authToken).Hex()
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
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts2@generaltask.com\",\"name\":\"Google\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_unlinkable\":false,\"has_bad_token\":false},{\"id\":\""+linearTokenID+"\",\"display_id\":\"Linear\",\"name\":\"Linear\",\"logo\":\"/images/linear.png\",\"logo_v2\":\"linear\",\"is_unlinkable\":true,\"has_bad_token\":false}]", string(body))

	})

	t.Run("SuccessWithBadToken", func(t *testing.T) {
		authToken := login("linkedaccounts3@generaltask.com", "")
		createGoogleLink(t, db, authToken, "linkedaccounts3@generaltask.com", true).Hex()
		linearTokenID := insertLinearToken(t, db, authToken).Hex()

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		googleTokenID := getGoogleTokenFromAuthToken(t, db, authToken).ID.Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts3@generaltask.com\",\"name\":\"Google\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_unlinkable\":false,\"has_bad_token\":true},{\"id\":\""+linearTokenID+"\",\"display_id\":\"Linear\",\"name\":\"Linear\",\"logo\":\"/images/linear.png\",\"logo_v2\":\"linear\",\"is_unlinkable\":true,\"has_bad_token\":false}]", string(body))
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
	parentCtx := context.Background()
	t.Run("MalformattedAccountID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		createGoogleLink(t, db, authToken, "approved@generaltask.com", false).Hex()
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("DELETE", "/linked_accounts/123/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("InvalidAccountID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		createGoogleLink(t, db, authToken, "approved@generaltask.com", false).Hex()
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("DELETE", "/linked_accounts/"+primitive.NewObjectID().Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("UnlinkableAccount", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		createGoogleLink(t, db, authToken, "approved@generaltask.com", false).Hex()
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
		authToken := login("approved@generaltask.com", "")
		createGoogleLink(t, db, authToken, "approved@generaltask.com", false).Hex()
		authTokenOther := login("other@generaltask.com", "")
		createGoogleLink(t, db, authTokenOther, "other@generaltask.com", false).Hex()
		googleAccountID := getGoogleTokenFromAuthToken(t, db, authTokenOther).ID
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("DELETE", "/linked_accounts/"+googleAccountID.Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("deletelinkedaccount@generaltask.com", "")
		linearTokenID := insertLinearToken(t, db, authToken)
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("DELETE", "/linked_accounts/"+linearTokenID.Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		var token database.ExternalAPIToken
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err := database.GetExternalTokenCollection(db).FindOne(
			dbCtx,
			bson.M{"_id": linearTokenID},
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

func createGoogleLink(t *testing.T, db *mongo.Database, authToken string, email string, isBadToken bool) primitive.ObjectID {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	res, err := database.GetExternalTokenCollection(db).InsertOne(
		dbCtx,
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
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	res, err := database.GetExternalTokenCollection(db).InsertOne(
		dbCtx,
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
