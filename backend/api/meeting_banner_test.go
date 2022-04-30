package api

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMeetingBanner(t *testing.T) {
	authToken := login("approved@generaltask.com", "")
	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("GET", "/meeting_banner/", nil)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
	t.Run("Success", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("GET", "/meeting_banner/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"title\":\"Your next meeting is at 4:20pm\",\"subtitle\":\"It looks like you've got a little time before your next meeting (6.9 min)\",\"events\":[{\"title\":\"Blast off\",\"meeting_link\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}],\"actions\":[{\"logo\":\"github\",\"title\":\"Review PR: Email reply v0\",\"link\":\"https://github.com/GeneralTask/task-manager/pull/1027\"}]}", string(body))
	})
}
