package utils

import (
	"strings"

	"github.com/GeneralTask/task-manager/backend/database"
	"mvdan.cc/xurls/v2"
)

var ConferencePatterns = map[string]database.ConferenceCall{
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
func GetConferenceUrlFromString(text string) *database.ConferenceCall {
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
