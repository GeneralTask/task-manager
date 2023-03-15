package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestDashboardData(t *testing.T) {
	authToken := login("test_dashboard_data@generaltask.com", "")
	UnauthorizedTest(t, "GET", "/dashboard/data/", nil)
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	testTime := time.Date(2023, time.January, 4, 20, 0, 0, 0, time.UTC)
	api.OverrideTime = &testTime
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
		request, _ := http.NewRequest("GET", "/dashboard/data/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		var dashboardResult DashboardResult
		err = json.Unmarshal(body, &dashboardResult)
		assert.NoError(t, err)
		assert.Equal(t, 1, dashboardResult)
		empJSON, err := json.MarshalIndent(dashboardResult, "", "  ")
		if err != nil {
			log.Fatalf(err.Error())
		}
		fmt.Printf("MarshalIndent funnction output %s\n", string(empJSON))
	})
}

/*
  // all lists will be consistently ordered in the way they should show up
   // you can assume intervals will always exist
 "intervals": [
       {
           "id": "123",
           "date_start": "2023-01-02",
           "date_end": "2023-01-07",
           "is_default": true
       }
   ],
   // you can assume at least 2 subjects will always exist (team and one individual)
   "subjects": [
       {
           "id": "1234",
           "name": "Your team",
           "icon": "users",
           "is_default": true,
           "graph_ids": ["graph_id123"],
       }
   ],
   // you can assume graph definitions will exist for graph ids provided above
   "graphs": {
       "graph_id123": {
           "name": "Code review response time",
           "icon": "github",
           "lines": [
               {
                   "data_id": "data_id12345",
                   "name": "Daily average",
                   "color": "blue",
                   "aggregated_name": "Weekly average (your team)",
               }
           ]
       }
   },
   // there will not necessarily be data available for all intervals and all lines
   "data": {
       "subject_id12456": {
           "interval_id123": {
               "data_id12345" : {
                   "aggregated_value": 54,
                   "points": [
                       {"x": 12423423423, "y", 57}
                   ]
               }
           }
       }


   },
}


*/
