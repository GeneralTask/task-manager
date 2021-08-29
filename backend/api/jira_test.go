package api

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/external"
	"golang.org/x/oauth2"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
)

func TestAuthorizeJIRA(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, &API{}, "/authorize/jira/")
	})

	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, &API{}, "/authorize/jira/")
	})

	t.Run("Success", func(t *testing.T) {
		TestAuthorizeSuccess(t, &API{AtlassianConfig: external.AtlassianConfig{OauthConfig: external.GetAtlassianOauthConfig()}}, "/authorize/jira/", func(stateToken string) string {
			return "<a href=\"https://auth.atlassian.com/authorize?access_type=offline&amp;client_id=" + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + "&amp;prompt=consent&amp;redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauthorize%2Fjira%2Fcallback&amp;response_type=code&amp;scope=read%3Ajira-work+read%3Ajira-user+write%3Ajira-work&amp;state=" + stateToken + "&amp;audience=api.atlassian.com\">Found</a>.\n\n"
		})
	})
}

func TestAuthorizeJIRACallback(t *testing.T) {
	// t.Run("CookieMissing", func(t *testing.T) {
	// 	TestAuthorizeCookieMissing(t, &API{}, "/authorize/jira/callback/")
	// })
	// t.Run("CookieBad", func(t *testing.T) {
	// 	TestAuthorizeCookieBad(t, &API{}, "/authorize/jira/callback/")
	// })
	// t.Run("MissingCodeParam", func(t *testing.T) {
	// 	TestAuthorizeCallbackMissingCodeParam(t, &API{}, "/authorize/jira/callback/")
	// })
	// t.Run("BadStateTokenFormat", func(t *testing.T) {
	// 	TestAuthorizeCallbackBadStateTokenFormat(t, &API{}, "/authorize/jira/callback/")
	// })
	// t.Run("InvalidStateToken", func(t *testing.T) {
	// 	TestAuthorizeCallbackInvalidStateToken(t, &API{}, "/authorize/jira/callback/")
	// })
	// t.Run("InvalidStateTokenWrongUser", func(t *testing.T) {
	// 	TestAuthorizeCallbackStateTokenWrongUser(t, &API{}, "/authorize/jira/callback/")
	// })
	// t.Run("UnsuccessfulResponse", func(t *testing.T) {
	// 	server := getTokenServerForJIRA(t, http.StatusUnauthorized)
	// 	TestAuthorizeCallbackUnsuccessfulResponse(t, &API{
	// 		AtlassianConfig: external.AtlassianConfig{
	// 			ConfigValues: external.AtlassianConfigValues{
	// 				TokenURL: &server.URL,
	// 			},
	// 		},
	// 	}, "/authorize/jira/callback/")
	// })
	t.Run("Success", func(t *testing.T) {
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		cloudServer := getCloudIDServerForJIRA(t, http.StatusOK, false)
		priorityServer := getJIRAPriorityServer(t, http.StatusOK, []byte(`[{"id" : "1"}]`))

		atlassianConfig := &oauth2.Config{
			ClientID:     config.GetConfigValue("JIRA_OAUTH_CLIENT_ID"),
			ClientSecret: config.GetConfigValue("JIRA_OAUTH_CLIENT_SECRET"),
			Endpoint: oauth2.Endpoint{
				AuthURL:  tokenServer.URL,
				TokenURL: tokenServer.URL,
			},
			RedirectURL: config.GetConfigValue("SERVER_URL") + "authorize/jira/callback",
			Scopes:      []string{"read:jira-work", "read:jira-user", "write:jira-work"},
		}
		oauthConfig := &external.OauthConfig{Config: atlassianConfig}

		api := &API{AtlassianConfig: external.AtlassianConfig{
			OauthConfig: oauthConfig,
			ConfigValues: external.AtlassianConfigValues{
				TokenURL:        &tokenServer.URL,
				CloudIDURL:      &cloudServer.URL,
				PriorityListURL: &priorityServer.URL,
			}}}

		TestAuthorizeCallbackSuccessfulResponse(t, api, "/authorize/jira/callback/", database.TaskSourceJIRA.Name)
	})
}

func getCloudIDServerForJIRA(t *testing.T, statusCode int, empty bool) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "Bearer sample-access-token", r.Header.Get("Authorization"))
		body, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		assert.Equal(t, "", string(body))
		w.WriteHeader(statusCode)
		if empty {
			w.Write([]byte(`[]`))
		} else {
			w.Write([]byte(`[{"id": "teslatothemoon42069", "url": "https://dankmemes.com", "name": "The dungeon"}]`))
		}
	}))
}

func getTokenServerForJIRA(t *testing.T, statusCode int) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		w.WriteHeader(statusCode)
		w.Write([]byte(`{"access_token":"sample-access-token","refresh_token":"sample-refresh-token","scope":"sample-scope","expires_in":3600,"token_type":"Bearer"}`))
	}))
}

func getTransitionIDServerForJIRA(t *testing.T) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, r.RequestURI, "/rest/api/3/issue/sample_jira_id/transitions")
		if r.Method == "GET" {
			w.WriteHeader(200)
			w.Write([]byte(`{"transitions": [{"id": "100"}]}`))
		} else if r.Method == "POST" {
			body, err := ioutil.ReadAll(r.Body)
			assert.NoError(t, err)
			assert.Equal(t, "{\"transition\": {\"id\": \"100\"}}", string(body))
			w.WriteHeader(204)
		} else {
			w.WriteHeader(400)
		}
	}))
}

func getJIRAPriorityServer(t *testing.T, statusCode int, response []byte) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/rest/api/3/priority/", r.RequestURI)
		assert.Equal(t, "GET", r.Method)
		w.WriteHeader(statusCode)
		w.Write(response)
	}))
}
