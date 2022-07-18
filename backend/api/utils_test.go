package api

import (
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestCORSHeaders(t *testing.T) {
	t.Run("OPTIONS preflight request", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("OPTIONS", "/tasks/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusNoContent, recorder.Code)
		headers := recorder.Result().Header
		assert.Equal(t, "Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Content-Type,Timezone-Offset,sentry-trace,baggage",
			headers.Get("Access-Control-Allow-Headers"))
		assert.Equal(t, "http://localhost:3000", headers.Get("Access-Control-Allow-Origin"))
		assert.Equal(t, "POST, OPTIONS, GET, PUT, PATCH, DELETE", headers.Get("Access-Control-Allow-Methods"))
	})
	t.Run("GET request", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("GET", "/ping_authed/", nil)
		authToken := login("approved@generaltask.com", "")
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)
		headers := recorder.Result().Header
		assert.Equal(t, "Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Content-Type,Timezone-Offset,sentry-trace,baggage",
			headers.Get("Access-Control-Allow-Headers"))
		assert.Equal(t, "http://localhost:3000", headers.Get("Access-Control-Allow-Origin"))
		assert.Equal(t, "POST, OPTIONS, GET, PUT, PATCH, DELETE", headers.Get("Access-Control-Allow-Methods"))
	})
}

func TestAuthenticationMiddleware(t *testing.T) {
	authToken := login("approved@generaltask.com", "")

	t.Run("InvalidLength", func(t *testing.T) {
		recorder := runAuthenticatedEndpoint("Bearer hello")
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
		recorder = runAuthenticatedEndpoint("hello")
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
		recorder = runAuthenticatedEndpoint(authToken)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"incorrect auth token format\"}", string(body))
	})

	t.Run("InvalidToken", func(t *testing.T) {
		recorder := runAuthenticatedEndpoint("Bearer c5b034f4-a645-4352-91d6-0c271afc4076")
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"unauthorized\"}", string(body))
	})

	t.Run("Valid", func(t *testing.T) {
		recorder := runAuthenticatedEndpoint("Bearer " + authToken)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "\"success\"", string(body))
	})
}

func TestLoggingMiddleware(t *testing.T) {
	authToken := login("approved@generaltask.com", "")
	t.Run("Success", func(t *testing.T) {
		router := GetRouter(GetAPI())

		request, _ := http.NewRequest("GET", "/bing_bong/", nil)
		request.Header.Add("Authorization", authToken)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		dbCtx, cancel := context.WithTimeout(context.Background(), constants.DatabaseTimeout)
		defer cancel()
		count, err := database.GetLogEventsCollection(db).CountDocuments(
			dbCtx,
			bson.M{"event_type": "api_hit_/bing_bong/"},
		)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	t.Run("DoesntRecordForLogEndpoint", func(t *testing.T) {
		router := GetRouter(GetAPI())

		request, _ := http.NewRequest("POST", "/log_events/", nil)
		request.Header.Add("Authorization", authToken)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		dbCtx, cancel := context.WithTimeout(context.Background(), constants.DatabaseTimeout)
		defer cancel()
		count, err := database.GetLogEventsCollection(db).CountDocuments(
			dbCtx,
			bson.M{"event_type": "api_hit_/log_events/"},
		)
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(GetAPI())

		request, _ := http.NewRequest("GET", "/bing_bong_two/", nil)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		dbCtx, cancel := context.WithTimeout(context.Background(), constants.DatabaseTimeout)
		defer cancel()
		count, err := database.GetLogEventsCollection(db).CountDocuments(
			dbCtx,
			bson.M{"event_type": "api_hit_/bing_bong_two/"},
		)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
}

func Test404(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("GET", "/not/a-route/", nil)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
}

func TestIsLocalServer(t *testing.T) {
	assert.False(t, isLocalServer())
}
