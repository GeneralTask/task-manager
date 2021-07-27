package api

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func getGmailArchiveServer(t *testing.T, expectedLabel string) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"removeLabelIds\":[\""+expectedLabel+"\"]}\n", string(body))
		w.WriteHeader(200)
		w.Write([]byte(`{}`))
	}))
}
