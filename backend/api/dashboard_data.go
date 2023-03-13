package api

import (
	"fmt"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

type DashboardSubject struct {
	ID      string            `json:"id"`
	Name    string            `json:"name"`
	Icon    string            `json:"icon"`
	Metrics []DashboardMetric `json:"metrics"`
}

type DashboardMetric struct {
	Name  string          `json:"name"`
	Icon  string          `json:"icon"`
	Lines []DashboardLine `json:"lines"`
}

type DashboardLine struct {
	Name            string           `json:"name"`
	Color           string           `json:"color"`
	AggregatedName  string           `json:"aggregated_name"`
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
	if err != nil {
		Handle500(c)
		return
	}
	dashboardTeamMembers, err := database.GetDashboardTeamMembers(api.DB, dashboardTeam.ID)
	if err != nil {
		Handle500(c)
		return
	}
	lookbackDays := DEFAULT_LOOKBACK_DAYS + time.Now().Weekday()
	dashboardDataPoints, err := database.GetDashboardDataPoints(api.DB, dashboardTeam.ID, lookbackDays)
	if err != nil {
		Handle500(c)
		return
	}
	fmt.Println(userID, dashboardTeam, dashboardTeamMembers, dashboardDataPoints)
	// [done] check that user has business mode enabled (or use middleware?)
	// [done] get or create dashboard team (made helper)
	// [done] query dashboard team members (make helper)
	// [done] determine list of subjects (team + team members -> easy)
	// helper for fetching data points (filter by subject, optionally team ID and do team member in-memory) - or maybe all in one
	// fetch industry data points
	// fetch team data points
	// fetch team member data points
	// combine into API result
	c.JSON(200, bson.M{})
}
