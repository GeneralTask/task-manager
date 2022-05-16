package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type meetingBanner struct {
	Title    string                `json:"title"`
	Subtitle string                `json:"subtitle"`
	Events   []meetingBannerEvent  `json:"events"`
	Actions  []meetingBannerAction `json:"actions"`
}

type meetingBannerEvent struct {
	Title          string         `json:"title"`
	ConferenceCall ConferenceCall `json:"conference_call"`
}

type meetingBannerAction struct {
	Logo  string `json:"logo"`
	Title string `json:"title"`
	Link  string `json:"link"`
}

func (api *API) MeetingBanner(c *gin.Context) {
	c.JSON(http.StatusOK, meetingBanner{
		Title:    "Your next meeting is at 4:20pm",
		Subtitle: "It looks like you've got a little time before your next meeting (6.9 min)",
		Events: []meetingBannerEvent{{
			Title: "Blast off",
			ConferenceCall: ConferenceCall{
				Platform: "Google Meet",
				Logo:     "/images/google-meet.svg",
				URL:      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			},
		}},
		Actions: []meetingBannerAction{
			{
				Logo:  "github",
				Title: "Review PR: Email reply v0",
				Link:  "https://github.com/GeneralTask/task-manager/pull/1027",
			},
			{
				Logo:  "gmail",
				Title: "Unread email: Ramp Daily Digest for May 12",
				Link:  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			},
			{
				Logo:  "slack",
				Title: "Unread messages from john",
				Link:  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			},
		},
	})
}
