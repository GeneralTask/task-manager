package testutils

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateTimestamp(dt string) *time.Time {
	createdAt, _ := time.Parse(constants.YEAR_MONTH_DAY_FORMAT, dt)
	return &createdAt
}

func CreateDateTime(dt string) *primitive.DateTime {
	res := primitive.NewDateTimeFromTime(*CreateTimestamp(dt))
	return &res
}

func GetMockAPIServer(t *testing.T, statusCode int, body string) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := io.ReadAll(r.Body)
		assert.NoError(t, err)
		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		_, err = w.Write([]byte(body))
		assert.NoError(t, err)
	}))
}
