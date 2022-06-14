package api

import (
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/testutils"
)

const GithubUserResponsePayload string = `{
	"login": "octocat",
	"id": 1,
	"node_id": "MDQ6VXNlcjE=",
	"avatar_url": "https://github.com/images/error/octocat_happy.gif",
	"gravatar_id": "",
	"url": "https://api.github.com/users/octocat",
	"html_url": "https://github.com/octocat",
	"followers_url": "https://api.github.com/users/octocat/followers",
	"following_url": "https://api.github.com/users/octocat/following{/other_user}",
	"gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
	"starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
	"subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
	"organizations_url": "https://api.github.com/users/octocat/orgs",
	"repos_url": "https://api.github.com/users/octocat/repos",
	"events_url": "https://api.github.com/users/octocat/events{/privacy}",
	"received_events_url": "https://api.github.com/users/octocat/received_events",
	"type": "User",
	"site_admin": false,
	"name": "monalisa octocat",
	"company": "GitHub",
	"blog": "https://github.com/blog",
	"location": "San Francisco",
	"email": "octocat@github.com",
	"hireable": false,
	"bio": "There once was...",
	"twitter_username": "monatheoctocat",
	"public_repos": 2,
	"public_gists": 1,
	"followers": 20,
	"following": 0,
	"created_at": "2008-01-14T04:33:35Z",
	"updated_at": "2008-01-14T04:33:35Z",
	"private_gists": 81,
	"total_private_repos": 100,
	"owned_private_repos": 100,
	"disk_usage": 10000,
	"collaborators": 8,
	"two_factor_authentication": true,
	"plan": {
	  "name": "Medium",
	  "space": 400,
	  "private_repos": 20,
	  "collaborators": 0
	}
  }`

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
		server := testutils.GetMockAPIServer(t, http.StatusUnauthorized, DefaultTokenPayload)
		api := GetAPI()
		(api.ExternalConfig.Github.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL
		TestAuthorizeCallbackUnsuccessfulResponse(t, api, "/link/github/callback/")
	})
	t.Run("Success", func(t *testing.T) {
		server := testutils.GetMockAPIServer(t, http.StatusOK, DefaultTokenPayload)
		api := GetAPI()
		(api.ExternalConfig.Github.OauthConfig.(*external.OauthConfig)).Config.Endpoint.TokenURL = server.URL

		accountIdServer := testutils.GetMockAPIServer(t, http.StatusOK, GithubUserResponsePayload)
		api.ExternalConfig.Github.ConfigValues.BaseURL = &accountIdServer.URL
		TestAuthorizeCallbackSuccessfulResponse(t, api, "/link/github/callback/", external.TASK_SERVICE_ID_GITHUB)
	})
}
