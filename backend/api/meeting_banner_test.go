package api

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMeetingBanner(t *testing.T) {
	authToken := login("approved@generaltask.com", "")

	UnauthorizedTest(t, "GET", "/meeting_banner/", nil)
	t.Run("Success", func(t *testing.T) {
		body := ServeRequest(t, authToken, "GET", "/meeting_banner/", nil, http.StatusOK)
		assert.Equal(t, "{\"title\":\"Your next meeting is at 4:20pm\",\"subtitle\":\"It looks like you've got a little time before your next meeting (6.9 min)\",\"events\":[{\"title\":\"Blast off\",\"meeting_link\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}],\"actions\":[{\"logo\":\"github\",\"title\":\"Review PR: Email reply v0\",\"link\":\"https://github.com/GeneralTask/task-manager/pull/1027\"}]}", string(body))
	})
}
