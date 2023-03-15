package api

import (
	"fmt"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DashboardResult struct {
	Intervals []DashboardInterval                 `json:"intervals"`
	Subjects  []DashboardSubject                  `json:"subjects"`
	Graphs    map[string]DashboardGraph           `json:"graphs"`
	Data      map[string]map[string]DashboardData `json:"data"`
}

type DashboardInterval struct {
	ID        primitive.ObjectID `json:"id"`
	DateStart string             `json:"date_start"`
	DateEnd   string             `json:"date_end"`
	IsDefault bool               `json:"is_default"`
}

type DashboardSubject struct {
	ID        string               `json:"id"`
	Name      string               `json:"name"`
	Icon      string               `json:"icon"`
	GraphIDs  []primitive.ObjectID `json:"graph_ids"`
	IsDefault bool                 `json:"is_default"`
}

type DashboardGraph struct {
	Name  string          `json:"name"`
	Icon  string          `json:"icon"`
	Lines []DashboardLine `json:"lines"`
}

type DashboardLine struct {
	DataID         string `json:"data_id"`
	Name           string `json:"name"`
	Color          string `json:"color"`
	AggregatedName string `json:"aggregated_name"`
}

type DashboardData struct {
	AggregatedValue int              `json:"aggregated_value"`
	Points          []DashboardPoint `json:"points"`
}

type DashboardPoint struct {
	X int `json:"x"`
	Y int `json:"y"`
}

const DEFAULT_LOOKBACK_DAYS = 14

func (api *API) DashboardData(c *gin.Context) {
	userID := getUserIDFromContext(c)
	dashboardTeam, err := database.GetOrCreateDashboardTeam(api.DB, userID)
	if err != nil || dashboardTeam == nil {
		Handle500(c)
		return
	}
	dashboardTeamMembers, err := database.GetDashboardTeamMembers(api.DB, dashboardTeam.ID)
	if err != nil || dashboardTeamMembers == nil {
		Handle500(c)
		return
	}
	// this lookback calculation is approximate for now, will refine as needed
	lookbackDays := DEFAULT_LOOKBACK_DAYS + int(time.Now().Weekday())
	dashboardDataPoints, err := database.GetDashboardDataPoints(api.DB, dashboardTeam.ID, lookbackDays)
	if err != nil || dashboardDataPoints == nil {
		Handle500(c)
		return
	}
	subjectIDToGraphTypeToDataPoints := make(map[string]map[string][]database.DashboardDataPoint)
	for _, dataPoint := range *dashboardDataPoints {
		subjectID := constants.DashboardSubjectGlobal
		if dataPoint.TeamID != primitive.NilObjectID {
			subjectID = dataPoint.TeamID.Hex()
		}
		if dataPoint.IndividualID != primitive.NilObjectID {
			subjectID = dataPoint.IndividualID.Hex()
		}
		dataPointsOfType := subjectIDToGraphTypeToDataPoints[subjectID][dataPoint.GraphType]
		subjectIDToGraphTypeToDataPoints[subjectID][dataPoint.GraphType] = append(dataPointsOfType, dataPoint)
	}
	result := []DashboardSubject{{
		ID:   dashboardTeam.ID.Hex(),
		Name: "Your team",
		Icon: "users",
		Metrics: []DashboardMetric{{
			Name: "Code review response time",
			Icon: "github",
			Lines: []DashboardLine{
				{
					Name:            "Daily average (Your team)",
					Color:           "pink",
					AggregatedName:  "Weekly average (Your team)",
					AggregatedValue: 50,
				},
			},
		}},
	}}
	for _, teamMember := range *dashboardTeamMembers {
		result = append(result, DashboardSubject{
			ID:   teamMember.ID.Hex(),
			Name: teamMember.Name,
			Icon: "user",
		})
	}
	fmt.Println(userID, dashboardTeam, dashboardTeamMembers, dashboardDataPoints)
	c.JSON(200, bson.M{})
}
