package main

import (
	"context"
	"io/ioutil"
	"net/http"
	"strings"

	"golang.org/x/oauth2"
)

// Generic wrapper over a HTTP Client
type HTTPClient interface {
	Get(url string) (*http.Response, error)
}

// Generic configuration information that should be passed around the document.
type APIConfig struct {
	WhitelistedUsers map[string]struct{}
}

// API is the object containing API route handlers
type API struct {
	GoogleConfig OauthConfigWrapper
	InternalConfig APIConfig
}



////////////////////////////////////////////////////////////////////////////////
// OAuth Configuration Wrapper

// Configuration for OAuth.
type OauthConfigWrapper interface {
	// The URL of the provider. We query this for refresh and exchange requests.
	AuthCodeURL(state string, opts ...oauth2.AuthCodeOption) string

	// An HTTP Client meant for fetching and refreshing an OAuth token.
	Client(ctx context.Context, t *oauth2.Token) HTTPClient

	// The token initially sent back by google upon the successful completion of
	// a user authorization request. It can then be exchanged for an actual token
	// to be used in production.
	Exchange(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error)
}

// A wrapper around an OAuth configuration to future proof our Oauth implementation.
type oauthConfigWrapper struct {
	Config *oauth2.Config
}

func (c *oauthConfigWrapper) AuthCodeURL(state string, opts ...oauth2.AuthCodeOption) string {
	return c.Config.AuthCodeURL(state, opts...)
}

func (c *oauthConfigWrapper) Exchange(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return c.Config.Exchange(ctx, code, opts...)
}

func (c *oauthConfigWrapper) Client(ctx context.Context, t *oauth2.Token) HTTPClient {
	return c.Config.Client(ctx, t)
}


////////////////////////////////////////////////////////////////////////////////
// API Config

// Read the list of white listed users from the text files in
// config/whitelist.txt (file should be a newline seperated list of emails)
func parseAPIConfig(c *APIConfig) error {
	whitelist , err := ioutil.ReadFile("./config/whitelist.txt")
	if err != nil {
		return err
	}

	// Split the file into lines
 	users := strings.Split(string(whitelist), "\n")

	usersMap := make(map[string]struct{}, len(users))
	for _, user := range users {
		usersMap[user] = struct{}{}
	}
	c.WhitelistedUsers = usersMap
	return nil
}
