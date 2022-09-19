package api

import (
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestAuthorizeCookieMissing(t *testing.T, api *API, url string) {
	router := GetRouter(api)
	request, _ := http.NewRequest("GET", url, nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	body, err := ioutil.ReadAll(recorder.Body)
	assert.NoError(t, err)
	assert.Equal(
		t,
		"{\"detail\":\"missing authToken cookie\"}",
		string(body),
	)
}

func TestAuthorizeCookieBad(t *testing.T, api *API, url string) {
	router := GetRouter(api)
	request, _ := http.NewRequest("GET", url, nil)
	request.AddCookie(&http.Cookie{Name: "authToken", Value: "tothemoon"})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	body, err := ioutil.ReadAll(recorder.Body)
	assert.NoError(t, err)
	assert.Equal(
		t,
		"{\"detail\":\"invalid auth token\"}",
		string(body),
	)
}

func TestAuthorizeSuccess(t *testing.T, api *API, url string, expectedResult func(string) string) {
	router := GetRouter(api)
	request, _ := http.NewRequest("GET", url, nil)
	authToken := login("authorize_success@generaltask.com", "")
	request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusFound, recorder.Code)
	body, err := ioutil.ReadAll(recorder.Body)
	// Grab from body where we expect the state token
	exp := regexp.MustCompile("state=([^&\"]+)(&|$|\")")
	bodyString := string(body)
	matches := exp.FindStringSubmatch(bodyString)
	assert.Equal(t, 3, len(matches))
	stateToken := matches[1]
	assert.NoError(t, err)
	assert.Equal(
		t,
		expectedResult(stateToken),
		bodyString,
	)
}

func TestAuthorizeCallbackMissingCodeParam(t *testing.T, api *API, url string) {
	router := GetRouter(api)
	request, _ := http.NewRequest("GET", url, nil)
	authToken := login("authorize_missing_code@generaltask.com", "")
	request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	body, err := ioutil.ReadAll(recorder.Body)
	assert.NoError(t, err)
	assert.Equal(
		t,
		"{\"detail\":\"missing query params\"}",
		string(body),
	)
}

func TestAuthorizeCallbackBadStateTokenFormat(t *testing.T, api *API, url string) {
	router := GetRouter(api)
	request, _ := http.NewRequest("GET", url+"?code=123abc&state=oopsie", nil)
	authToken := login("authorize_bad_state_token@generaltask.com", "")
	request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	body, err := ioutil.ReadAll(recorder.Body)
	assert.NoError(t, err)
	assert.Equal(
		t,
		"{\"detail\":\"invalid state token format\"}",
		string(body),
	)
}

func TestAuthorizeCallbackInvalidStateToken(t *testing.T, api *API, url string) {
	router := GetRouter(api)
	request, _ := http.NewRequest("GET", url+"?code=123abc&state=6088e1c97018a22f240aa573", nil)
	authToken := login("authorize_invalid_state_token@generaltask.com", "")
	request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	body, err := ioutil.ReadAll(recorder.Body)
	assert.NoError(t, err)
	assert.Equal(
		t,
		"{\"detail\":\"invalid state token\"}",
		string(body),
	)
}

func TestAuthorizeCallbackStateTokenWrongUser(t *testing.T, api *API, url string) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	randomUserID := primitive.NewObjectID()
	stateToken, err := database.CreateStateToken(db, &randomUserID, false)
	assert.NoError(t, err)

	router := GetRouter(api)
	request, _ := http.NewRequest("GET", url+"?code=123abc&state="+*stateToken, nil)
	authToken := login("authorize_wrong_user@generaltask.com", "")
	request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	body, err := ioutil.ReadAll(recorder.Body)
	assert.NoError(t, err)
	assert.Equal(
		t,
		"{\"detail\":\"invalid state token\"}",
		string(body),
	)
}

func TestAuthorizeCallbackUnsuccessfulResponse(t *testing.T, api *API, url string) {
	authToken := login("authorize_unsuccessful@generaltask.com", "")
	stateToken, err := newStateToken(api.DB, authToken, false)
	assert.NoError(t, err)

	router := GetRouter(api)
	request, _ := http.NewRequest("GET", url+"?code=123abc&state="+*stateToken, nil)
	request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.NotEqual(t, http.StatusOK, recorder.Code)
}

func TestAuthorizeCallbackSuccessfulResponse(t *testing.T, api *API, url string, serviceID string) {
	authToken := login("authorize_successful@generaltask.com", "")
	stateToken, err := newStateToken(api.DB, authToken, false)
	assert.NoError(t, err)

	router := GetRouter(api)

	request, _ := http.NewRequest("GET", url+"?code=123abc&state="+*stateToken, nil)
	request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusOK, recorder.Code)

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	internalAPITokenCollection := database.GetInternalTokenCollection(db)
	var authTokenStruct database.InternalAPIToken
	err = internalAPITokenCollection.FindOne(context.Background(), bson.M{"token": authToken}).Decode(&authTokenStruct)
	assert.NoError(t, err)
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	count, err := externalAPITokenCollection.CountDocuments(
		context.Background(),
		bson.M{"$and": []bson.M{{"user_id": authTokenStruct.UserID}, {"service_id": serviceID}}})

	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
	var externalToken database.ExternalAPIToken
	err = externalAPITokenCollection.FindOne(context.Background(), bson.M{"$and": []bson.M{{"user_id": authTokenStruct.UserID}, {"service_id": serviceID}}}).Decode(&externalToken)
	assert.NoError(t, err)
	assert.Equal(t, serviceID, externalToken.ServiceID)
	assert.True(t, len(externalToken.AccountID) > 0)
	assert.True(t, len(externalToken.DisplayID) > 0)
	assert.True(t, len(externalToken.Token) > 0)
}
