package testutils

import (
	"github.com/GeneralTask/task-manager/backend/api"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func CreateTimestamp(dt string) *time.Time {
	createdAt, _ := time.Parse("2006-01-02", dt)
	return &createdAt
}

func CreateDateTime(dt string) *primitive.DateTime {
	res := primitive.NewDateTimeFromTime(*CreateTimestamp(dt))
	return &res
}

func ServeRequest(
	t *testing.T,
	authToken string,
	method string,
	url string,
	requestBody io.Reader,
	expectedReponseCode int,
) []byte {
	router := api.GetRouter(api.GetAPI())
	request, _ := http.NewRequest(method, url, requestBody)
	request.Header.Add("Authorization", "Bearer "+authToken)

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, expectedReponseCode, recorder.Code)
	responseBody, err := ioutil.ReadAll(recorder.Body)
	assert.NoError(t, err)
	return responseBody
}

func UnauthorizedTest(t *testing.T, method string, url string, body io.Reader) bool {
	return t.Run("Unauthorized", func(t *testing.T) {
		router := api.GetRouter(api.GetAPI())
		request, _ := http.NewRequest(method, url, body)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
}
