package api

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestOverviewSuggestions(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	UnauthorizedTest(t, "GET", "/overview/views/suggestion/", nil)
	t.Run("NonGeneralTaskAccess", func(t *testing.T) {
		authtoken := login("test_overview@notGeneralTask.com", "")
		request, _ := http.NewRequest("GET", "/overview/views/suggestion/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, `{"detail":"inaccessible"}`, string(body))
	})

	// TODO mock responses for further testing
}

func TestOverviewRemaining(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	UnauthorizedTest(t, "GET", "/overview/views/suggestions_remaining/", nil)
	t.Run("Success", func(t *testing.T) {
		authtoken := login("suggest_remaining_success@generaltask.com", "")
		request, _ := http.NewRequest("GET", "/overview/views/suggestions_remaining/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)
		request.Header.Set("Timezone-Offset", "0")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, `3`, string(body))
	})

	// TODO write test that includes refresh
}
