package api

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
)

func TestAuthorizeSlack(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, GetAPI(), "/authorize/slack/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, GetAPI(), "/authorize/slack/")
	})
	t.Run("Success", func(t *testing.T) {
		TestAuthorizeSuccess(t, GetAPI(), "/authorize/slack/", func(stateToken string) string {
			return "<a href=\"https://slack.com/oauth/authorize?access_type=offline&amp;client_id=" + config.GetConfigValue("SLACK_OAUTH_CLIENT_ID") + "&amp;prompt=consent&amp;redirect_uri=https%3A%2F%2Fapi.generaltask.io%2Fauthorize%2Fslack%2Fcallback&amp;response_type=code&amp;scope=channels%3Ahistory+channels%3Aread+im%3Aread+mpim%3Ahistory+im%3Ahistory+groups%3Ahistory+groups%3Aread+mpim%3Awrite+im%3Awrite+channels%3Awrite+groups%3Awrite+chat%3Awrite%3Auser&amp;state=" + stateToken + "\">Found</a>.\n\n"
		})
	})
}

func TestAuthorizeSlackCallback(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, GetAPI(), "/authorize/slack/callback/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, GetAPI(), "/authorize/slack/callback/")
	})
	t.Run("MissingCodeParam", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, GetAPI(), "/authorize/slack/callback/")
	})
	t.Run("BadStateTokenFormat", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, GetAPI(), "/authorize/slack/callback/")
	})
	t.Run("InvalidStateToken", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, GetAPI(), "/authorize/slack/callback/")
	})
	t.Run("InvalidStateTokenWrongUser", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, GetAPI(), "/authorize/slack/callback/")
	})
	t.Run("UnsuccessfulResponse", func(t *testing.T) {
		server := getTokenServerForSlack(t, http.StatusUnauthorized)
		api := GetAPI()
		(api.ExternalConfig.Slack.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		TestAuthorizeCallbackUnsuccessfulResponse(t, api, "/authorize/slack/callback/")
	})
	t.Run("Success", func(t *testing.T) {
		server := getTokenServerForSlack(t, http.StatusOK)
		api := GetAPI()
		(api.ExternalConfig.Slack.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		TestAuthorizeCallbackSuccessfulResponse(t, api, "/authorize/slack/callback/", database.TaskSourceSlack.Name)
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
