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
		assert.True(t, strings.Contains(string(body), "{\"name\":\"Google Calendar\",\"logo\":\"/images/gcal.png\",\"logo_v2\":\"gcal\",\"authorization_url\":\"http://localhost:8080/link/google/\"}"))
		assert.Equal(t, 1, strings.Count(string(body), "{\"name\":\"Slack\",\"logo\":\"/images/slack.svg\",\"logo_v2\":\"slack\",\"authorization_url\":\"http://localhost:8080/link/slack/\"}"))
	})
	UnauthorizedTest(t, "GET", "/linked_accounts/supported_types/", nil)
}

func TestLinkedAccountsList(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	t.Run("SuccessOnlyGoogle", func(t *testing.T) {
		authToken := login("linkedaccounts@generaltask.com", "")
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		googleTokenID := getGoogleTokenFromAuthToken(t, api.DB, authToken).ID.Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts@generaltask.com\",\"name\":\"Google Calendar\",\"logo\":\"/images/gcal.png\",\"logo_v2\":\"gcal\",\"is_unlinkable\":false,\"has_bad_token\":false}]", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("linkedaccounts2@generaltask.com", "")
		linearTokenID := insertLinearToken(t, api.DB, authToken, false).Hex()
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		googleTokenID := getGoogleTokenFromAuthToken(t, api.DB, authToken).ID.Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts2@generaltask.com\",\"name\":\"Google Calendar\",\"logo\":\"/images/gcal.png\",\"logo_v2\":\"gcal\",\"is_unlinkable\":false,\"has_bad_token\":false},{\"id\":\""+linearTokenID+"\",\"display_id\":\"Linear\",\"name\":\"Linear\",\"logo\":\"/images/linear.png\",\"logo_v2\":\"linear\",\"is_unlinkable\":true,\"has_bad_token\":false}]", string(body))

	})

	t.Run("SuccessWithBadToken", func(t *testing.T) {
		authToken := login("linkedaccounts3@generaltask.com", "")
		linearTokenID := insertLinearToken(t, api.DB, authToken, true).Hex()

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
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts3@generaltask.com\",\"name\":\"Google Calendar\",\"logo\":\"/images/gcal.png\",\"logo_v2\":\"gcal\",\"is_unlinkable\":false,\"has_bad_token\":false},{\"id\":\""+linearTokenID+"\",\"display_id\":\"Linear\",\"name\":\"Linear\",\"logo\":\"/images/linear.png\",\"logo_v2\":\"linear\",\"is_unlinkable\":true,\"has_bad_token\":true}]", string(body))
	})
	UnauthorizedTest(t, "GET", "/linked_accounts/", nil)
}

func TestDeleteLinkedAccount(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	t.Run("MalformattedAccountID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		router := GetRouter(api)
		request, _ := http.NewRequest("DELETE", "/linked_accounts/123/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("InvalidAccountID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		router := GetRouter(api)
		request, _ := http.NewRequest("DELETE", "/linked_accounts/"+primitive.NewObjectID().Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("NotUnlinkableAccount", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
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
		authTokenOther := login("other@generaltask.com", "")
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
		linearTokenID := insertLinearToken(t, api.DB, authToken, false)
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
	t.Run("SuccessGithub", func(t *testing.T) {
		authToken := login("deletelinkedaccount_github@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)
		// should delete cached repos upon github unlink
		repositoryCollection := database.GetRepositoryCollection(api.DB)
		res, err := repositoryCollection.InsertOne(context.Background(), &database.Repository{UserID: userID})
		assert.NoError(t, err)
		repoToDeleteID := res.InsertedID.(primitive.ObjectID)
		// wrong user id; shouldn't get deleted
		res, err = repositoryCollection.InsertOne(context.Background(), &database.Repository{UserID: primitive.NewObjectID()})
		assert.NoError(t, err)
		repoToKeepID := res.InsertedID.(primitive.ObjectID)
		res, err = database.GetExternalTokenCollection(api.DB).InsertOne(
			context.Background(),
			&database.ExternalAPIToken{
				ServiceID:    external.TASK_SERVICE_ID_GITHUB,
				UserID:       userID,
				DisplayID:    "Github",
				IsUnlinkable: true,
			},
		)
		assert.NoError(t, err)
		externalTokenID := res.InsertedID.(primitive.ObjectID)

		router := GetRouter(api)
		request, _ := http.NewRequest("DELETE", "/linked_accounts/"+externalTokenID.Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		var token database.ExternalAPIToken
		err = database.GetExternalTokenCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": externalTokenID},
		).Decode(&token)
		// assert token is not found in db anymore
		assert.Error(t, err)

		var repository database.Repository
		err = repositoryCollection.FindOne(context.Background(), bson.M{"_id": repoToDeleteID}).Decode(&repository)
		// assert repo is not found in db anymore
		assert.Error(t, err)

		err = repositoryCollection.FindOne(context.Background(), bson.M{"_id": repoToKeepID}).Decode(&repository)
		// assert repo is found
		assert.NoError(t, err)
	})
	UnauthorizedTest(t, "DELETE", "/linked_accounts/123/", nil)
}

func insertLinearToken(t *testing.T, db *mongo.Database, authToken string, isBadToken bool) primitive.ObjectID {
	res, err := database.GetExternalTokenCollection(db).InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			ServiceID:    external.TASK_SERVICE_ID_LINEAR,
			UserID:       getUserIDFromAuthToken(t, db, authToken),
			DisplayID:    "Linear",
			IsUnlinkable: true,
			IsBadToken:   isBadToken,
		},
	)
	assert.NoError(t, err)
	return res.InsertedID.(primitive.ObjectID)
}
