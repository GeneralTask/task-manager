package api

import (
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/testutils"
)

const LinearTokenPayload string = `{"access_token":"sample-linear-access-token"}`
const LinearUserInfoPayload string = `{"data": {"viewer": { "id": "sample-linear-id", "name": "Test User", "email": "test@generaltask.com"}}}`

func TestLinkLinear(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, GetTestAPI(), "/link/linear/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, GetTestAPI(), "/link/linear/")
	})
	t.Run("Success", func(t *testing.T) {
		TestAuthorizeSuccess(t, GetTestAPI(), "/link/linear/", func(stateToken string) string {
			return "<a href=\"https://linear.app/oauth/authorize?access_type=offline&amp;client_id=" + config.GetConfigValue("LINEAR_OAUTH_CLIENT_ID") + "&amp;prompt=consent&amp;redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flink%2Flinear%2Fcallback%2F&amp;response_type=code&amp;scope=read+write&amp;state=" + stateToken + "\">Found</a>.\n\n"
		})
	})
}

func TestLinkLinearCallback(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, GetTestAPI(), "/link/linear/callback/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, GetTestAPI(), "/link/linear/callback/")
	})
	t.Run("MissingCodeParam", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, GetTestAPI(), "/link/linear/callback/")
	})
	t.Run("BadStateTokenFormat", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, GetTestAPI(), "/link/linear/callback/")
	})
	t.Run("InvalidStateToken", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, GetTestAPI(), "/link/linear/callback/")
	})
	t.Run("InvalidStateTokenWrongUser", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, GetTestAPI(), "/link/linear/callback/")
	})
	t.Run("UnsuccessfulResponse", func(t *testing.T) {
		server := testutils.GetMockAPIServer(t, http.StatusUnauthorized, LinearTokenPayload)
		api := GetTestAPI()
		(api.ExternalConfig.Linear.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		TestAuthorizeCallbackUnsuccessfulResponse(t, api, "/link/linear/callback/")
	})
	t.Run("Success", func(t *testing.T) {
		api := GetTestAPI()
		tokenServer := testutils.GetMockAPIServer(t, http.StatusOK, LinearTokenPayload)
		(api.ExternalConfig.Linear.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = tokenServer.URL
		userInfoServer := testutils.GetMockAPIServer(t, http.StatusOK, LinearUserInfoPayload)
		api.ExternalConfig.Linear.ConfigValues.UserInfoURL = &userInfoServer.URL
		TestAuthorizeCallbackSuccessfulResponse(t, api, "/link/linear/callback/", external.TASK_SERVICE_ID_LINEAR)
	})
}
