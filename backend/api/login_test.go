package api

import (
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"golang.org/x/oauth2"
)

func TestLoginRedirect(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	api.ExternalConfig.GoogleLoginConfig = &external.OauthConfig{Config: &oauth2.Config{
		ClientID:    "123",
		RedirectURL: "g.com",
		Scopes:      []string{"s1", "s2"},
	}}
	router := GetRouter(api)
	// Syntax taken from https://semaphoreci.com/community/tutorials/test-driven-development-of-go-web-applications-with-gin
	// Also inspired by https://dev.to/jacobsngoodwin/04-testing-first-gin-http-handler-9m0
	t.Run("Success", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/login/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusFound, recorder.Code)

		var stateToken string
		for _, c := range recorder.Result().Cookies() {
			if c.Name == "loginStateToken" {
				stateToken = c.Value
			}
		}

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"<a href=\"/login/?access_type=offline&amp;client_id=123&amp;include_granted_scopes=false&amp;redirect_uri=g.com&amp;response_type=code&amp;scope=s1+s2&amp;state="+stateToken+"\">Found</a>.\n\n",
			string(body),
		)

		stateTokenID, err := primitive.ObjectIDFromHex(stateToken)
		assert.NoError(t, err)
		token, err := database.GetStateToken(db, stateTokenID, nil)
		assert.NoError(t, err)
		assert.False(t, token.UseDeeplink)
	})
	t.Run("SuccessForce", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/login/?force_prompt=true", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusFound, recorder.Code)

		var stateToken string
		for _, c := range recorder.Result().Cookies() {
			if c.Name == "loginStateToken" {
				stateToken = c.Value
			}
		}

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"<a href=\"/login/?access_type=offline&amp;client_id=123&amp;include_granted_scopes=false&amp;prompt=consent&amp;redirect_uri=g.com&amp;response_type=code&amp;scope=s1+s2&amp;state="+stateToken+"\">Found</a>.\n\n",
			string(body),
		)

		stateTokenID, err := primitive.ObjectIDFromHex(stateToken)
		assert.NoError(t, err)
		token, err := database.GetStateToken(db, stateTokenID, nil)
		assert.NoError(t, err)
		assert.False(t, token.UseDeeplink)
	})
	t.Run("SuccessDeeplink", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/login/?use_deeplink=true", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusFound, recorder.Code)

		var stateToken string
		for _, c := range recorder.Result().Cookies() {
			if c.Name == "loginStateToken" {
				stateToken = c.Value
			}
		}

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"<a href=\"/login/?access_type=offline&amp;client_id=123&amp;include_granted_scopes=false&amp;redirect_uri=g.com&amp;response_type=code&amp;scope=s1+s2&amp;state="+stateToken+"\">Found</a>.\n\n",
			string(body),
		)

		stateTokenID, err := primitive.ObjectIDFromHex(stateToken)
		assert.NoError(t, err)
		token, err := database.GetStateToken(db, stateTokenID, nil)
		assert.NoError(t, err)
		assert.True(t, token.UseDeeplink)
	})
}

func TestLoginCallback(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	waitlistCollection := database.GetWaitlistCollection(db)

	t.Run("MissingQueryParams", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/login/callback/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"missing query params\"}", string(body))
	})

	t.Run("EmailNotApprovedOnWaitlist", func(t *testing.T) {
		// Waitlist entry doesn't matter if has_access = false or if different email
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		_, err := waitlistCollection.InsertOne(
			dbCtx,
			&database.WaitlistEntry{Email: "unapproved@gmail.com"},
		)
		assert.NoError(t, err)
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		_, err = waitlistCollection.InsertOne(
			dbCtx,
			&database.WaitlistEntry{
				Email:     "different_email@gmail.com",
				HasAccess: true,
			},
		)
		assert.NoError(t, err)

		recorder := makeLoginCallbackRequest("noice420", "unapproved@gmail.com", "", "example-token", "example-token", true, false)
		assert.Equal(t, http.StatusForbidden, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"email has not been approved.\"}", string(body))
	})
	t.Run("EmailNotApproved", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err := waitlistCollection.Drop(dbCtx)
		assert.NoError(t, err)
		recorder := makeLoginCallbackRequest("noice420", "unapproved@gmail.com", "", "example-token", "example-token", true, false)
		assert.Equal(t, http.StatusForbidden, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"email has not been approved.\"}", string(body))
		verifyLoginCallback(t, db, "unapproved@gmail.com", "noice420", true, false)
	})
	t.Run("Idempotent", func(t *testing.T) {
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.com", "", "example-token", "example-token", true, false)
		assert.Equal(t, http.StatusFound, recorder.Code)
		verifyLoginCallback(t, db, "approved@generaltask.com", "noice420", true, true)
		//change token and verify token updates and still only 1 row per user.
		recorder = makeLoginCallbackRequest("TSLA", "approved@generaltask.com", "", "example-token", "example-token", true, false)
		assert.Equal(t, http.StatusFound, recorder.Code)
		verifyLoginCallback(t, db, "approved@generaltask.com", "TSLA", true, true)
	})
	t.Run("UpdatesName", func(t *testing.T) {
		userCollection := database.GetUserCollection(db)
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.com", "Task Destroyer", "example-token", "example-token", true, false)
		assert.Equal(t, http.StatusFound, recorder.Code)
		var userObject database.User
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		userCollection.FindOne(dbCtx, bson.M{"google_id": "goog12345_approved@generaltask.com"}).Decode(&userObject)
		assert.Equal(t, "Task Destroyer", userObject.Name)

		recorder = makeLoginCallbackRequest("noice420", "approved@generaltask.com", "Elon Musk", "example-token", "example-token", true, false)
		assert.Equal(t, http.StatusFound, recorder.Code)
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		userCollection.FindOne(dbCtx, bson.M{"google_id": "goog12345_approved@generaltask.com"}).Decode(&userObject)
		assert.Equal(t, "Elon Musk", userObject.Name)
	})
	t.Run("BadStateTokenFormat", func(t *testing.T) {
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.com", "", "example-token", "example-token", false, false)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid state token format\"}", string(body))
	})
	t.Run("BadStateTokenCookieFormat", func(t *testing.T) {
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.com", "", "6088e1c97018a22f240aa573", "example-token", false, false)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid state token cookie format\"}", string(body))
	})
	t.Run("StateTokensDontMatch", func(t *testing.T) {
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.com", "", "6088e1c97018a22f240aa573", "6088e1c97018a22f240aa574", false, false)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"state token does not match cookie\"}", string(body))
	})
	t.Run("InvalidStateToken", func(t *testing.T) {
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.com", "", "6088e1c97018a22f240aa573", "6088e1c97018a22f240aa573", false, false)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid state token\"}", string(body))
	})
	t.Run("SuccessSecondTime", func(t *testing.T) {
		// Verifies request succeeds on second auth (no refresh token supplied)
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		_, err = database.GetExternalTokenCollection(db).DeleteOne(dbCtx, bson.M{"$and": []bson.M{{"account_id": "approved@generaltask.com"}, {"service_id": external.TASK_SERVICE_ID_GOOGLE}}})
		assert.NoError(t, err)
		stateToken, err := newStateToken("", false)
		assert.NoError(t, err)
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.com", "", *stateToken, *stateToken, false, true)
		assert.Equal(t, http.StatusFound, recorder.Code)
		verifyLoginCallback(t, db, "approved@generaltask.com", "noice420", true, true)
	})
	t.Run("Success", func(t *testing.T) {
		stateToken, err := newStateToken("", false)
		assert.NoError(t, err)
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.com", "", *stateToken, *stateToken, false, false)
		assert.Equal(t, http.StatusFound, recorder.Code)
		verifyLoginCallback(t, db, "approved@generaltask.com", "noice420", true, true)
	})
	t.Run("SuccessDeeplink", func(t *testing.T) {
		stateToken, err := newStateToken("", true)
		assert.NoError(t, err)
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.com", "", *stateToken, *stateToken, false, false)
		assert.Equal(t, http.StatusFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Contains(t, string(body), "generaltask://authentication?authToken=")
		verifyLoginCallback(t, db, "approved@generaltask.com", "noice420", true, true)
	})
	t.Run("SuccessWaitlist", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		_, err := waitlistCollection.InsertOne(
			dbCtx,
			&database.WaitlistEntry{
				Email:     "dogecoin@tothe.moon",
				HasAccess: true,
			},
		)
		assert.NoError(t, err)
		stateToken, err := newStateToken("", false)
		assert.NoError(t, err)
		recorder := makeLoginCallbackRequest("noice420", "dogecoin@tothe.moon", "", *stateToken, *stateToken, false, false)
		assert.Equal(t, http.StatusFound, recorder.Code)
		verifyLoginCallback(t, db, "dogecoin@tothe.moon", "noice420", true, true)
	})
}
