package api

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
)

func TestLinkSlack(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, GetAPI(), "/link/slack/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, GetAPI(), "/link/slack/")
	})
	t.Run("Success", func(t *testing.T) {
		TestAuthorizeSuccess(t, GetAPI(), "/link/slack/", func(stateToken string) string {
			return "<a href=\"https://slack.com/oauth/authorize?access_type=offline&amp;client_id=1734323190625.2094863322451&amp;prompt=consent&amp;redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flink%2Fslack%2Fcallback%2F&amp;response_type=code&amp;scope=identify+channels%3Ahistory+channels%3Aread+im%3Aread+mpim%3Ahistory+im%3Ahistory+groups%3Ahistory+groups%3Aread+mpim%3Awrite+im%3Awrite+channels%3Awrite+groups%3Awrite+chat%3Awrite%3Auser&amp;state=" + stateToken + "\">Found</a>.\n\n"
		})
	})
}

func TestLinkSlackCallback(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, GetAPI(), "/link/slack/callback/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, GetAPI(), "/link/slack/callback/")
	})
	t.Run("MissingCodeParam", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, GetAPI(), "/link/slack/callback/")
	})
	t.Run("BadStateTokenFormat", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, GetAPI(), "/link/slack/callback/")
	})
	t.Run("InvalidStateToken", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, GetAPI(), "/link/slack/callback/")
	})
	t.Run("InvalidStateTokenWrongUser", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, GetAPI(), "/link/slack/callback/")
	})
	t.Run("UnsuccessfulResponse", func(t *testing.T) {
		server := getTokenServerForSlack(t, http.StatusUnauthorized)
		api := GetAPI()
		(api.ExternalConfig.Slack.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		TestAuthorizeCallbackUnsuccessfulResponse(t, api, "/link/slack/callback/")
	})
	t.Run("FailedUserInfoResponse", func(t *testing.T) {
		api := GetAPI()
		server := getTokenServerForSlack(t, http.StatusOK)
		(api.ExternalConfig.Slack.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		userInfoServer := getUserInfoForSlack(t, http.StatusBadRequest)
		userInfoURL := userInfoServer.URL + "/"
		api.ExternalConfig.Slack.ConfigValues.UserInfoURL = &userInfoURL
		TestAuthorizeCallbackUnsuccessfulResponse(t, api, "/link/slack/callback/")
	})
	t.Run("Success", func(t *testing.T) {
		api := GetAPI()
		server := getTokenServerForSlack(t, http.StatusOK)
		(api.ExternalConfig.Slack.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		userInfoServer := getUserInfoForSlack(t, http.StatusOK)
		userInfoURL := userInfoServer.URL + "/"
		api.ExternalConfig.Slack.ConfigValues.UserInfoURL = &userInfoURL
		TestAuthorizeCallbackSuccessfulResponse(t, api, "/link/slack/callback/", external.TASK_SERVICE_ID_SLACK)
	})
}

func getTokenServerForSlack(t *testing.T, statusCode int) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		w.Write([]byte(`{"access_token":"sample-access-token"}`))
	}))
}

func getUserInfoForSlack(t *testing.T, statusCode int) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		w.Write([]byte(`{
			"ok": true,
			"url": "https://tothemoon.slack.com/",
			"team": "Dogecoin",
			"user": "shibetoshi",
			"team_id": "T69420694",
			"user_id": "W42069420"
		}`))
	}))
}
