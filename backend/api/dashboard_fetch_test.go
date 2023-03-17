package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestDashboardFetch(t *testing.T) {
	authToken := login("test_dashboard_fetch@generaltask.com", "")
	UnauthorizedTest(t, "GET", "/dashboard/data/fetch/", nil)
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	testTime := time.Date(2023, time.January, 4, 20, 0, 0, 0, time.UTC)
	api.OverrideTime = &testTime
	router := GetRouter(api)
	t.Run("NoBusinessAccess", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/dashboard/data/fetch/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusForbidden, recorder.Code)
	})
	userID := getUserIDFromAuthToken(t, api.DB, authToken)
	_, err := database.GetUserCollection(api.DB).UpdateOne(context.Background(), bson.M{"_id": userID}, bson.M{"$set": bson.M{"business_mode_enabled": true}})
	assert.NoError(t, err)
	t.Run("Success", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/dashboard/data/fetch/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		assert.Equal(t, 1, 2)
	})
}
