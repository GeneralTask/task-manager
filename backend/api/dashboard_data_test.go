package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/constants"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
)

func TestDashboardData(t *testing.T) {
	authToken := login("test_dashboard_data@generaltask.com", "")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	testTime := time.Date(2023, time.January, 4, 20, 0, 0, 0, time.UTC)
	api.OverrideTime = &testTime
	router := GetRouter(api)
	userID := getUserIDFromAuthToken(t, api.DB, authToken)
	team, err := database.GetOrCreateDashboardTeam(api.DB, userID)
	assert.NoError(t, err)

	// wrong team
	team2, err := database.GetOrCreateDashboardTeam(api.DB, primitive.NewObjectID())
	assert.NoError(t, err)

	dashboardTeamMemberCollection := database.GetDashboardTeamMemberCollection(api.DB)
	res, err := dashboardTeamMemberCollection.InsertOne(context.Background(), database.DashboardTeamMember{TeamID: team.ID})
	assert.NoError(t, err)

	// wrong team ID
	res2, err := dashboardTeamMemberCollection.InsertOne(context.Background(), database.DashboardTeamMember{TeamID: team2.ID})
	assert.NoError(t, err)
	teamMember1ID := res.InsertedID.(primitive.ObjectID)
	teamMember2ID := res2.InsertedID.(primitive.ObjectID)

	dashboardDataPointCollection := database.GetDashboardDataPointCollection(api.DB)
	_, err = dashboardDataPointCollection.InsertOne(context.Background(), database.DashboardDataPoint{
		GraphType: constants.DashboardGraphTypePRResponseTime,
		Value:     13,
		Date:      primitive.NewDateTimeFromTime(time.Date(2023, time.January, 3, 0, 0, 0, 0, time.UTC)),
	})
	assert.NoError(t, err)
	_, err = dashboardDataPointCollection.InsertOne(context.Background(), database.DashboardDataPoint{
		GraphType: constants.DashboardGraphTypePRResponseTime,
		Value:     20,
		Date:      primitive.NewDateTimeFromTime(time.Date(2023, time.January, 4, 0, 0, 0, 0, time.UTC)),
	})

	// team data points
	assert.NoError(t, err)
	_, err = dashboardDataPointCollection.InsertOne(context.Background(), database.DashboardDataPoint{
		TeamID:    team.ID,
		GraphType: constants.DashboardGraphTypePRResponseTime,
		Value:     16,
		Date:      primitive.NewDateTimeFromTime(time.Date(2022, time.December, 28, 0, 0, 0, 0, time.UTC)),
	})
	assert.NoError(t, err)
	_, err = dashboardDataPointCollection.InsertOne(context.Background(), database.DashboardDataPoint{
		TeamID:    team.ID,
		GraphType: constants.DashboardGraphTypePRResponseTime,
		Value:     32,
		Date:      primitive.NewDateTimeFromTime(time.Date(2022, time.December, 27, 0, 0, 0, 0, time.UTC)),
	})
	assert.NoError(t, err)
	// wrong team ID
	_, err = dashboardDataPointCollection.InsertOne(context.Background(), database.DashboardDataPoint{
		TeamID:    team2.ID,
		GraphType: constants.DashboardGraphTypePRResponseTime,
		Value:     2,
		Date:      primitive.NewDateTimeFromTime(time.Date(2022, time.December, 27, 0, 0, 0, 0, time.UTC)),
	})

	// team member data points
	assert.NoError(t, err)
	_, err = dashboardDataPointCollection.InsertOne(context.Background(), database.DashboardDataPoint{
		IndividualID: teamMember1ID,
		TeamID:       team.ID,
		GraphType:    constants.DashboardGraphTypePRResponseTime,
		Value:        100,
		Date:         primitive.NewDateTimeFromTime(time.Date(2022, time.December, 28, 0, 0, 0, 0, time.UTC)),
	})
	assert.NoError(t, err)
	_, err = dashboardDataPointCollection.InsertOne(context.Background(), database.DashboardDataPoint{
		IndividualID: teamMember1ID,
		TeamID:       team.ID,
		GraphType:    constants.DashboardGraphTypePRResponseTime,
		Value:        105,
		Date:         primitive.NewDateTimeFromTime(time.Date(2022, time.December, 27, 0, 0, 0, 0, time.UTC)),
	})
	assert.NoError(t, err)
	// missing individual ID
	_, err = dashboardDataPointCollection.InsertOne(context.Background(), database.DashboardDataPoint{
		TeamID:    team2.ID,
		GraphType: constants.DashboardGraphTypePRResponseTime,
		Value:     2,
		Date:      primitive.NewDateTimeFromTime(time.Date(2022, time.December, 27, 0, 0, 0, 0, time.UTC)),
	})
	assert.NoError(t, err)
	// wrong team ID
	_, err = dashboardDataPointCollection.InsertOne(context.Background(), database.DashboardDataPoint{
		TeamID:       team2.ID,
		IndividualID: teamMember2ID,
		GraphType:    constants.DashboardGraphTypePRResponseTime,
		Value:        2,
		Date:         primitive.NewDateTimeFromTime(time.Date(2022, time.December, 27, 0, 0, 0, 0, time.UTC)),
	})
	assert.NoError(t, err)

	// wrong timestamps
	// over a weekend
	_, err = dashboardDataPointCollection.InsertOne(context.Background(), database.DashboardDataPoint{
		GraphType: constants.DashboardGraphTypePRResponseTime,
		Value:     15,
		Date:      primitive.NewDateTimeFromTime(time.Date(2023, time.January, 1, 0, 0, 0, 0, time.UTC)),
	})
	assert.NoError(t, err)
	// out of range
	_, err = dashboardDataPointCollection.InsertOne(context.Background(), database.DashboardDataPoint{
		GraphType: constants.DashboardGraphTypePRResponseTime,
		Value:     20,
		Date:      primitive.NewDateTimeFromTime(time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)),
	})
	assert.NoError(t, err)
	UnauthorizedTest(t, "GET", "/dashboard/data/", nil)
	NoBusinessAccessTest(t, "GET", "/dashboard/data/", api, authToken)
	EnableBusinessAccess(t, api, userID)
	t.Run("Success", func(t *testing.T) {
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
		fmt.Println(prettyRender(dashboardResult, t))
		assert.Equal(
			t,
			`{
	"intervals": [
		{
			"id": "000000000000000000000030",
			"date_start": "2022-12-19",
			"date_end": "2022-12-23",
			"is_default": false
		},
		{
			"id": "000000000000000000000031",
			"date_start": "2022-12-26",
			"date_end": "2022-12-30",
			"is_default": false
		},
		{
			"id": "000000000000000000000032",
			"date_start": "2023-01-02",
			"date_end": "2023-01-06",
			"is_default": true
		}
	],
	"subjects": [
		{
			"id": "000000000000000000000101",
			"name": "Your Team",
			"icon": "team",
			"graph_ids": [
				"000000000000000000000003",
				"000000000000000000000001"
			],
			"is_default": true
		},
		{
			"id": "`+teamMember1ID.Hex()+`",
			"name": "",
			"icon": "user",
			"graph_ids": [
				"000000000000000000000004",
				"000000000000000000000002"
			],
			"is_default": false
		}
	],
	"graphs": {
		"000000000000000000000001": {
			"name": "Code review response time",
			"icon": "github",
			"lines": [
				{
					"name": "Daily average (Your team)",
					"color": "pink",
					"aggregated_name": "Weekly average (Your team)",
					"data_id": "000000000000000000000006",
					"subject_id_override": null
				},
				{
					"name": "Daily average (Industry)",
					"color": "gray",
					"aggregated_name": "Weekly average (Industry)",
					"data_id": "000000000000000000000005",
					"subject_id_override": null
				}
			]
		},
		"000000000000000000000002": {
			"name": "Code review response time",
			"icon": "github",
			"lines": [
				{
					"name": "Daily average (Team member)",
					"color": "blue",
					"aggregated_name": "Weekly average (Team member)",
					"data_id": "000000000000000000000007",
					"subject_id_override": null
				},
				{
					"name": "Daily average (Your team)",
					"color": "gray",
					"aggregated_name": "Weekly average (Your team)",
					"data_id": "000000000000000000000006",
					"subject_id_override": "000000000000000000000101"
				}
			]
		},
		"000000000000000000000003": {
			"name": "Hours per day in big blocks",
			"icon": "gcal",
			"lines": [
				{
					"name": "Daily average (Your team)",
					"color": "pink",
					"aggregated_name": "Weekly average (Your team)",
					"data_id": "000000000000000000000009",
					"subject_id_override": null
				},
				{
					"name": "Daily average (Industry)",
					"color": "gray",
					"aggregated_name": "Weekly average (Industry)",
					"data_id": "000000000000000000000008",
					"subject_id_override": null
				}
			]
		},
		"000000000000000000000004": {
			"name": "Hours per day in big blocks",
			"icon": "gcal",
			"lines": [
				{
					"name": "Daily average (Team member)",
					"color": "blue",
					"aggregated_name": "Weekly average (Team member)",
					"data_id": "000000000000000000000100",
					"subject_id_override": null
				},
				{
					"name": "Daily average (Your team)",
					"color": "gray",
					"aggregated_name": "Weekly average (Your team)",
					"data_id": "000000000000000000000009",
					"subject_id_override": "000000000000000000000101"
				}
			]
		}
	},
	"data": {
		"000000000000000000000101": {
			"000000000000000000000031": {
				"000000000000000000000006": {
					"aggregated_value": 24,
					"points": [
						{
							"x": 1672099200,
							"y": 32
						},
						{
							"x": 1672185600,
							"y": 16
						}
					]
				}
			},
			"000000000000000000000032": {
				"000000000000000000000005": {
					"aggregated_value": 16,
					"points": [
						{
							"x": 1672704000,
							"y": 13
						},
						{
							"x": 1672790400,
							"y": 20
						}
					]
				}
			}
		},
		"`+teamMember1ID.Hex()+`": {
			"000000000000000000000031": {
				"000000000000000000000007": {
					"aggregated_value": 102,
					"points": [
						{
							"x": 1672099200,
							"y": 105
						},
						{
							"x": 1672185600,
							"y": 100
						}
					]
				}
			}
		}
	}
}`, prettyRender(dashboardResult, t))
	})
}

func prettyRender(v any, t *testing.T) string {
	empJSON, err := json.MarshalIndent(v, "", "\t")
	assert.NoError(t, err)
	return string(empJSON)
}
