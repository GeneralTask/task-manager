package api

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
)

func TestLinkGithub(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, GetAPI(), "/link/github/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, GetAPI(), "/link/github/")
	})
	t.Run("Success", func(t *testing.T) {
		TestAuthorizeSuccess(t, GetAPI(), "/link/github/", func(stateToken string) string {
			return "<a href=\"https://github.com/login/oauth/authorize?access_type=offline&amp;client_id=" + config.GetConfigValue("GITHUB_OAUTH_CLIENT_ID") + "&amp;prompt=consent&amp;redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flink%2Fgithub%2Fcallback%2F&amp;response_type=code&amp;scope=repo&amp;state=" + stateToken + "\">Found</a>.\n\n"
		})
	})
}

func TestLinkGithubCallback(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, GetAPI(), "/link/github/callback/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, GetAPI(), "/link/github/callback/")
	})
	t.Run("MissingCodeParam", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, GetAPI(), "/link/github/callback/")
	})
	t.Run("BadStateTokenFormat", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, GetAPI(), "/link/github/callback/")
	})
	t.Run("InvalidStateToken", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, GetAPI(), "/link/github/callback/")
	})
	t.Run("InvalidStateTokenWrongUser", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, GetAPI(), "/link/github/callback/")
	})
	t.Run("UnsuccessfulResponse", func(t *testing.T) {
		server := getTokenServerForGithub(t, http.StatusUnauthorized, DefaultTokenPayload)
		api := GetAPI()
		(api.ExternalConfig.Github.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		TestAuthorizeCallbackUnsuccessfulResponse(t, api, "/link/github/callback/")
	})
	t.Run("Success", func(t *testing.T) {
		server := getTokenServerForGithub(t, http.StatusOK, DefaultTokenPayload)
		api := GetAPI()
		(api.ExternalConfig.Github.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		TestAuthorizeCallbackSuccessfulResponse(t, api, "/link/github/callback/", external.TASK_SERVICE_ID_GITHUB)
	})
}

func getTokenServerForGithub(t *testing.T, statusCode int, body string) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		w.Write([]byte(body))
	}))
}
