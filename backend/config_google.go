package main

import (
	"io/ioutil"
	"log"
	"os"
	"strings"

	"golang.org/x/oauth2/google"
)

// Authorization scopes to request from google at login
var GOOGLE_AUTH_SCOPES = []string {
	"https://www.googleapis.com/auth/userinfo.email",
	"https://www.googleapis.com/auth/gmail.modify",
	"https://www.googleapis.com/auth/calendar.events",
}

////////////////////////////////////////////////////////////////////////////////
// Configuration Parsing

// Adapted from https://developers.google.com/people/quickstart/go
//
// Parse the local credentials file into an acceptable format for
// development. If local development is enabled, then change the redirect url to
// localhost.
func getGoogleConfig() OauthConfigWrapper {
	development := os.Getenv("DEVELOPMENT")

	// Read the credentials file in config/google_credentials.json
	bData, err := ioutil.ReadFile("config/google_credentials.json")
	if err != nil {
		log.Fatalf("Unable to read credentials file: %v", err)
	}

	// Create google configuration, with auth scope. Google demmands authorization
	// scopes to be formatted as a series of URL's seperated by spaces
	config, err := google.ConfigFromJSON(bData, strings.Join(GOOGLE_AUTH_SCOPES, ""))
	if err != nil {
		log.Fatalf("Unable to parse credentials file: %v", err)
	}

	// If in development mode, set the redirect url to a local address.
	if development != "" {
		config.RedirectURL = strings.Replace(
			config.RedirectURL,
			"https://generaltask.io",
			"http://localhost:8080",
			1)
	}

	return &oauthConfigWrapper{Config: config}
}
