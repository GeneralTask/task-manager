package api

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"golang.org/x/oauth2"
)

func TestLoginRedirect(t *testing.T) {
	// Syntax taken from https://semaphoreci.com/community/tutorials/test-driven-development-of-go-web-applications-with-gin
	// Also inspired by https://dev.to/jacobsngoodwin/04-testing-first-gin-http-handler-9m0
	t.Run("Success", func(t *testing.T) {
		router := GetRouter(&API{GoogleConfig: &OauthConfig{Config: &oauth2.Config{
			ClientID:    "123",
			RedirectURL: "g.com",
			Scopes:      []string{"s1", "s2"},
		}}})

		request, _ := http.NewRequest("GET", "/login/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusFound, recorder.Code)

		var stateToken string
		for _, c := range recorder.Result().Cookies() {
			if c.Name == "googleStateToken" {
				stateToken = c.Value
			}
		}

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"<a href=\"/login/?access_type=offline&amp;client_id=123&amp;prompt=consent&amp;redirect_uri=g.com&amp;response_type=code&amp;scope=s1+s2&amp;state="+stateToken+"\">Found</a>.\n\n",
			string(body),
		)
	})
}

func TestLoginCallback(t *testing.T) {
	t.Run("MissingQueryParams", func(t *testing.T) {
		router := GetRouter(&API{})

		request, _ := http.NewRequest("GET", "/login/callback/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"Missing query params\"}", string(body))
	})
	t.Run("EmailNotApproved", func(t *testing.T) {
		recorder := makeLoginCallbackRequest("noice420", "unapproved@gmail.com", "example-token", "example-token", true)
		assert.Equal(t, http.StatusForbidden, recorder.Code)
	})
	t.Run("Idempotent", func(t *testing.T) {
		db, dbCleanup := database.GetDBConnection()
		defer dbCleanup()
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.io", "example-token", "example-token", true)
		assert.Equal(t, http.StatusFound, recorder.Code)
		verifyLoginCallback(t, db, "noice420")
		//change token and verify token updates and still only 1 row per user.
		recorder = makeLoginCallbackRequest("TSLA", "approved@generaltask.io", "example-token", "example-token", true)
		assert.Equal(t, http.StatusFound, recorder.Code)
		verifyLoginCallback(t, db, "TSLA")
	})
	t.Run("BadStateTokenFormat", func(t *testing.T) {
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.io", "example-token", "example-token", false)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"Invalid state token format\"}", string(body))
	})
	t.Run("BadStateTokenCookieFormat", func(t *testing.T) {
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.io", "6088e1c97018a22f240aa573", "example-token", false)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"Invalid state token cookie format\"}", string(body))
	})
	t.Run("StateTokensDontMatch", func(t *testing.T) {
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.io", "6088e1c97018a22f240aa573", "6088e1c97018a22f240aa574", false)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"State token does not match cookie\"}", string(body))
	})
	t.Run("InvalidStateToken", func(t *testing.T) {
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.io", "6088e1c97018a22f240aa573", "6088e1c97018a22f240aa573", false)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"Invalid state token\"}", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		db, dbCleanup := database.GetDBConnection()
		defer dbCleanup()
		stateToken := newStateToken("")
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.io", stateToken, stateToken, false)
		assert.Equal(t, http.StatusFound, recorder.Code)
		verifyLoginCallback(t, db, "noice420")
	})
}
