package testutils

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateTimestamp(dt string) *time.Time {
	createdAt, _ := time.Parse("2006-01-02", dt)
	return &createdAt
}

func CreateDateTime(dt string) *primitive.DateTime {
	res := primitive.NewDateTimeFromTime(*CreateTimestamp(dt))
	return &res
}

func GetMockAPIServer(t *testing.T, statusCode int, body string) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		w.Write([]byte(body))
	}))
}
