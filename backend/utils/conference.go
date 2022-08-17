package utils

import (
	"strings"

	"mvdan.cc/xurls/v2"
)

type ConferenceCall struct {
	Platform string `json:"platform" bson:"platform"`
	Logo     string `json:"logo" bson:"logo"`
	URL      string `json:"url" bson:"url"`
}

var ConferencePatterns = map[string]ConferenceCall{
	"meet.google.com": {
		Platform: "Google Meet",
		Logo:     "/images/google-meet.svg",
	},
	"zoom.us": {
		Platform: "Zoom",
		Logo:     "/images/zoom.svg",
	},
}

// only return the first conference url - in the future we may want to return all of them
func GetConferenceUrlFromString(text string) *ConferenceCall {
	for _, match := range xurls.Strict().FindAllString(text, -1) {
		for pattern, conferenceTemplate := range ConferencePatterns {
			if strings.Contains(match, pattern) {
				conference := conferenceTemplate
				conference.URL = match
				return &conference
			}
		}
	}
	return nil
}
