package api

import (
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
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
	authToken := login("approved@generaltask.io", "")
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
	authToken := login("approved@generaltask.io", "")
	request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	body, err := ioutil.ReadAll(recorder.Body)
	assert.NoError(t, err)
	assert.Equal(
		t,
		"{\"detail\":\"Missing query params\"}",
		string(body),
	)
}

func TestAuthorizeCallbackBadStateTokenFormat(t *testing.T, api *API, url string) {
	router := GetRouter(api)
	request, _ := http.NewRequest("GET", url+"?code=123abc&state=oopsie", nil)
	authToken := login("approved@generaltask.io", "")
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
	authToken := login("approved@generaltask.io", "")
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
	stateToken, err := database.CreateStateToken(db, &randomUserID)
	assert.NoError(t, err)

	router := GetRouter(api)
	request, _ := http.NewRequest("GET", url+"?code=123abc&state="+*stateToken, nil)
	authToken := login("approved@generaltask.io", "")
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
	authToken := login("approved@generaltask.io", "")
	stateToken, err := newStateToken(authToken)
	assert.NoError(t, err)

	router := GetRouter(api)
	request, _ := http.NewRequest("GET", url+"?code=123abc&state="+*stateToken, nil)
	request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.NotEqual(t, http.StatusOK, recorder.Code)
}

func TestAuthorizeCallbackSuccessfulResponse(t *testing.T, api *API, url string, serviceID string) {
	parentCtx := context.Background()
	authToken := login("approved@generaltask.io", "")
	stateToken, err := newStateToken(authToken)
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
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = internalAPITokenCollection.FindOne(dbCtx, bson.M{"token": authToken}).Decode(&authTokenStruct)
	assert.NoError(t, err)
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	count, err := externalAPITokenCollection.CountDocuments(
		dbCtx,
		bson.M{"$and": []bson.M{{"user_id": authTokenStruct.UserID}, {"service_id": serviceID}}})

	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
	var externalToken database.ExternalAPIToken
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = externalAPITokenCollection.FindOne(dbCtx, bson.M{"$and": []bson.M{{"user_id": authTokenStruct.UserID}, {"service_id": serviceID}}}).Decode(&externalToken)
	assert.NoError(t, err)
	assert.Equal(t, serviceID, externalToken.ServiceID)

	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
	var jiraToken database.ExternalAPIToken
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = externalAPITokenCollection.FindOne(dbCtx, bson.M{"$and": []bson.M{{"user_id": authTokenStruct.UserID}, {"service_id": external.TASK_SERVICE_ID_ATLASSIAN}}}).Decode(&jiraToken)
	assert.NoError(t, err)
	assert.Equal(t, external.TASK_SERVICE_ID_ATLASSIAN, jiraToken.ServiceID)
	assert.Equal(t, "teslatothemoon42069", jiraToken.AccountID)
	assert.Equal(t, "The dungeon", jiraToken.DisplayID)
}
