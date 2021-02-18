package main

import (
	"context"
	"net/http"

	"golang.org/x/oauth2"
)

// Generic wrapper over a HTTP Client
type HTTPClient interface {
	Get(url string) (*http.Response, error)
}

// API is the object containing API route handlers
type API struct {
	GoogleConfig OauthConfigWrapper
}



////////////////////////////////////////////////////////////////////////////////
// Configuration Wrapper

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
