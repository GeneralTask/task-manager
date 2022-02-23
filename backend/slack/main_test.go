package slack

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSendFeedbackMessage(t *testing.T) {
	t.Run("NoWebhook", func(t *testing.T) {
		err := SendFeedbackMessage("$hood to the moon")
		assert.NotNil(t, err)
		assert.Equal(t, "missing slack webhook setting", err.Error())
	})
	t.Run("BadResponse", func(t *testing.T) {
		server := getSlackServer(t, http.StatusBadRequest)
		err := os.Setenv("SLACK_WEBHOOK_FEEDBACK", server.URL)
		assert.NoError(t, err)
		err = SendFeedbackMessage("$hood to the moon")
		assert.NotNil(t, err)
		assert.Equal(t, "non-ok status code from slack: 400", err.Error())
		err = os.Unsetenv("SLACK_WEBHOOK_FEEDBACK")
		assert.NoError(t, err)
	})
	t.Run("Success", func(t *testing.T) {
		server := getSlackServer(t, http.StatusOK)
		err := os.Setenv("SLACK_WEBHOOK_FEEDBACK", server.URL)
		assert.NoError(t, err)
		err = SendFeedbackMessage("$hood to the moon")
		assert.NoError(t, err)
		err = os.Unsetenv("SLACK_WEBHOOK_FEEDBACK")
		assert.NoError(t, err)
	})
}

func getSlackServer(t *testing.T, statusCode int) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		w.Write([]byte("{}"))
	}))
}
