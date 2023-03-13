package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestDashboardData(t *testing.T) {
	authToken := login("test_dashboard_data@generaltask.com", "")
	UnauthorizedTest(t, "GET", "/dashboard/data/", nil)
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)
	t.Run("NoBusinessAccess", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/dashboard/data/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusForbidden, recorder.Code)
	})
	userID := getUserIDFromAuthToken(t, api.DB, authToken)
	_, err := database.GetUserCollection(api.DB).UpdateOne(context.Background(), bson.M{"_id": userID}, bson.M{"$set": bson.M{"business_mode_enabled": true}})
	assert.NoError(t, err)
	/*
		team
		- no team vs. existing team (can just rerun endpoint)
		- team with wrong user id

		team member
		- no team members
		- team member with wrong team id but with data
		- normal team member with no data
		- normal team member with data

		data points
		- no industry
		- yes industry
		- industry out of range
		- team member data / team data

		test cases
		- success no team no data
		- success team + team members no data
		- success team / team members / industry only data
		- success team / team members / all data

		for v0, just do github chart
	*/
	t.Run("SuccessNoData", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/dashboard/data/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		assert.Equal(t, 1, 2)
	})
}
