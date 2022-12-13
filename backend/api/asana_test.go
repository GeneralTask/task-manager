package api

import (
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/testutils"
)

func TestLinkAsana(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, api, "/link/asana/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, api, "/link/asana/")
	})
	t.Run("Success", func(t *testing.T) {
		TestAuthorizeSuccess(t, api, "/link/asana/", func(stateToken string) string {
			return "<a href=\"https://app.asana.com/-/oauth_authorize?access_type=offline&amp;client_id=" + config.GetConfigValue("ASANA_OAUTH_CLIENT_ID") + "&amp;prompt=consent&amp;redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flink%2Fasana%2Fcallback%2F&amp;response_type=code&amp;state=" + stateToken + "\">Found</a>.\n\n"
		})
	})
}

func TestLinkAsanaCallback(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, api, "/link/asana/callback/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, api, "/link/asana/callback/")
	})
	t.Run("MissingCodeParam", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, api, "/link/asana/callback/")
	})
	t.Run("BadStateTokenFormat", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, api, "/link/asana/callback/")
	})
	t.Run("InvalidStateToken", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, api, "/link/asana/callback/")
	})
	t.Run("InvalidStateTokenWrongUser", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, api, "/link/asana/callback/")
	})
	t.Run("UnsuccessfulResponse", func(t *testing.T) {
		server := testutils.GetMockAPIServer(t, http.StatusUnauthorized, DefaultTokenPayload)
		(api.ExternalConfig.Asana.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		TestAuthorizeCallbackUnsuccessfulResponse(t, api, "/link/asana/callback/")
	})
	t.Run("MissingData", func(t *testing.T) {
		server := testutils.GetMockAPIServer(t, http.StatusOK, `{"access_token":"sample-access-token"}`)
		(api.ExternalConfig.Asana.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		TestAuthorizeCallbackUnsuccessfulResponse(t, api, "/link/asana/callback/")
	})
	t.Run("MissingEmail", func(t *testing.T) {
		server := testutils.GetMockAPIServer(t, http.StatusOK, `{"access_token":"sample-access-token", "data": {}}`)
		(api.ExternalConfig.Asana.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		TestAuthorizeCallbackUnsuccessfulResponse(t, api, "/link/asana/callback/")
	})
	t.Run("Success", func(t *testing.T) {
		server := testutils.GetMockAPIServer(t, http.StatusOK, DefaultTokenPayload)
		(api.ExternalConfig.Asana.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		TestAuthorizeCallbackSuccessfulResponse(t, api, "/link/asana/callback/", external.TASK_SERVICE_ID_ASANA)
	})
}
