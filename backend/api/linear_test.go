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

const LinearTokenPayload string = `{"access_token":"sample-linear-access-token"}`
const LinearUserInfoPayload string = `{"data": {"viewer": { "id": "sample-linear-id", "name": "Test User", "email": "test@generaltask.com"}}}`

func TestLinkLinear(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, GetAPI(), "/link/linear/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, GetAPI(), "/link/linear/")
	})
	t.Run("Success", func(t *testing.T) {
		TestAuthorizeSuccess(t, GetAPI(), "/link/linear/", func(stateToken string) string {
			return "<a href=\"https://linear.app/oauth/authorize?access_type=offline&amp;client_id=" + config.GetConfigValue("LINEAR_OAUTH_CLIENT_ID") + "&amp;prompt=consent&amp;redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flink%2Flinear%2Fcallback%2F&amp;response_type=code&amp;scope=read+write&amp;state=" + stateToken + "\">Found</a>.\n\n"
		})
	})
}

func TestLinkLinearCallback(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, GetAPI(), "/link/linear/callback/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, GetAPI(), "/link/linear/callback/")
	})
	t.Run("MissingCodeParam", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, GetAPI(), "/link/linear/callback/")
	})
	t.Run("BadStateTokenFormat", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, GetAPI(), "/link/linear/callback/")
	})
	t.Run("InvalidStateToken", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, GetAPI(), "/link/linear/callback/")
	})
	t.Run("InvalidStateTokenWrongUser", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, GetAPI(), "/link/linear/callback/")
	})
	t.Run("UnsuccessfulResponse", func(t *testing.T) {
		server := getTokenServerForLinear(t, http.StatusUnauthorized, LinearTokenPayload)
		api := GetAPI()
		(api.ExternalConfig.Linear.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		TestAuthorizeCallbackUnsuccessfulResponse(t, api, "/link/linear/callback/")
	})
	t.Run("Success", func(t *testing.T) {
		api := GetAPI()
		tokenServer := getTokenServerForLinear(t, http.StatusOK, LinearTokenPayload)
		(api.ExternalConfig.Linear.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = tokenServer.URL
		userInfoServer := getTokenServerForLinear(t, http.StatusOK, LinearUserInfoPayload)
		api.ExternalConfig.Linear.ConfigValues.UserInfoURL = &userInfoServer.URL
		TestAuthorizeCallbackSuccessfulResponse(t, api, "/link/linear/callback/", external.TASK_SERVICE_ID_LINEAR)
	})
}

func getTokenServerForLinear(t *testing.T, statusCode int, body string) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		w.Write([]byte(body))
	}))
}
