package api

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
)

func TestLinkSlack(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, GetTestAPI(), "/link/slack/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, GetTestAPI(), "/link/slack/")
	})
	t.Run("Success", func(t *testing.T) {
		TestAuthorizeSuccess(t, GetTestAPI(), "/link/slack/", func(stateToken string) string {
			return "<a href=\"https://slack.com/oauth/authorize?access_type=offline&amp;client_id=" + config.GetConfigValue("SLACK_OAUTH_CLIENT_ID") + "&amp;prompt=consent&amp;redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flink%2Fslack%2Fcallback%2F&amp;response_type=code&amp;scope=commands+users%3Aread&amp;state=" + stateToken + "\">Found</a>.\n\n"
		})
	})
}

func TestLinkSlackCallback(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, GetTestAPI(), "/link/slack/callback/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, GetTestAPI(), "/link/slack/callback/")
	})
	t.Run("MissingCodeParam", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, GetTestAPI(), "/link/slack/callback/")
	})
	t.Run("BadStateTokenFormat", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, GetTestAPI(), "/link/slack/callback/")
	})
	t.Run("InvalidStateToken", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, GetTestAPI(), "/link/slack/callback/")
	})
	t.Run("InvalidStateTokenWrongUser", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, GetTestAPI(), "/link/slack/callback/")
	})
	t.Run("UnsuccessfulResponse", func(t *testing.T) {
		server := testutils.GetMockAPIServer(t, http.StatusUnauthorized, `{}`)
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		(api.ExternalConfig.Slack.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		TestAuthorizeCallbackUnsuccessfulResponse(t, api, "/link/slack/callback/")
	})
	t.Run("FailedUserInfoResponse", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		server := testutils.GetMockAPIServer(t, http.StatusOK, `{"access_token":"sample-access-token"}`)
		(api.ExternalConfig.Slack.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		userInfoServer := testutils.GetMockAPIServer(t, http.StatusBadRequest, `{
			"ok": true,
			"url": "https://tothemoon.slack.com/",
			"team": "Dogecoin",
			"user": "shibetoshi",
			"team_id": "T69420694",
			"user_id": "W42069420"
		}`)
		userInfoURL := userInfoServer.URL + "/"
		api.ExternalConfig.Slack.ConfigValues.UserInfoURL = &userInfoURL
		TestAuthorizeCallbackUnsuccessfulResponse(t, api, "/link/slack/callback/")
	})
	t.Run("Success", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		server := testutils.GetMockAPIServer(t, http.StatusOK, `{"access_token":"sample-access-token"}`)
		(api.ExternalConfig.Slack.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		userInfoServer := testutils.GetMockAPIServer(t, http.StatusOK, `{}`)
		userInfoURL := userInfoServer.URL + "/"
		api.ExternalConfig.Slack.ConfigValues.UserInfoURL = &userInfoURL
		TestAuthorizeCallbackSuccessfulResponse(t, api, "/link/slack/callback/", external.TASK_SERVICE_ID_SLACK)
	})
}

func TestLinkSlackApp(t *testing.T) {
	t.Run("FailedNoCode", func(t *testing.T) {
		api := GetTestAPI()

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/link_app/slack/?code=&state=", nil)
		authToken := login("authorize_success@generaltask.com", "")
		request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusInternalServerError, recorder.Code)
	})
	t.Run("FailedNoAccessToken", func(t *testing.T) {
		api := GetTestAPI()
		server := testutils.GetMockAPIServer(t, http.StatusOK, `{"access_token":""}`)
		(api.ExternalConfig.SlackApp.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/link_app/slack/?code=123abc&state=", nil)
		authToken := login("authorize_success@generaltask.com", "")
		request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusInternalServerError, recorder.Code)
	})
	t.Run("FailedExchangeFailure", func(t *testing.T) {
		api := GetTestAPI()
		server := testutils.GetMockAPIServer(t, http.StatusUnauthorized, "")
		(api.ExternalConfig.SlackApp.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/link_app/slack/?code=123abc&state=", nil)
		authToken := login("authorize_success@generaltask.com", "")
		request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusInternalServerError, recorder.Code)
	})
	t.Run("Success", func(t *testing.T) {
		api := GetTestAPI()
		server := testutils.GetMockAPIServer(t, http.StatusOK, `{"access_token":"sample-access-token"}`)
		(api.ExternalConfig.SlackApp.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/link_app/slack/?code=123abc&state=", nil)
		authToken := login("authorize_success@generaltask.com", "")
		request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusFound, recorder.Code)
	})
}
