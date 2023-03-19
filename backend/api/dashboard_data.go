package api

import (
	"sort"
	"strconv"
	"time"

	"github.com/GeneralTask/task-manager/backend/logging"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DashboardResult struct {
	Intervals []DashboardInterval                                                                `json:"intervals"`
	Subjects  []DashboardSubject                                                                 `json:"subjects"`
	Graphs    map[primitive.ObjectID]DashboardGraph                                              `json:"graphs"`
	Data      map[primitive.ObjectID]map[primitive.ObjectID]map[primitive.ObjectID]DashboardData `json:"data"`
}

type DashboardInterval struct {
	ID            primitive.ObjectID `json:"id"`
	DateStart     string             `json:"date_start"`
	DateEnd       string             `json:"date_end"`
	IsDefault     bool               `json:"is_default"`
	DatetimeStart time.Time          `json:"-"`
	DatetimeEnd   time.Time          `json:"-"`
}

type DashboardSubject struct {
	ID        primitive.ObjectID   `json:"id"`
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
	Name           string              `json:"name"`
	Color          string              `json:"color"`
	AggregatedName string              `json:"aggregated_name"`
	DataID         primitive.ObjectID  `json:"data_id"`
	SubjectID      *primitive.ObjectID `json:"subject_id_override"`
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
const NUM_DAYS_IN_WEEK = 7
const NUM_DAYS_IN_WEEKEND = 2
const NUM_HOURS_IN_DAY = 24
const NUM_WEEKDAYS = NUM_DAYS_IN_WEEK - NUM_DAYS_IN_WEEKEND

const ICON_TEAM = "team"
const ICON_USER = "user"
const ICON_GITHUB = "github"
const ICON_GCAL = "gcal"

const COLOR_PINK = "pink"
const COLOR_BLUE = "blue"
const COLOR_GRAY = "gray"

const TEAM_DAILY_AVERAGE = "Daily average (Your team)"
const TEAM_WEEKLY_AVERAGE = "Weekly average (Your team)"
const TEAM_MEMBER_DAILY_AVERAGE = "Daily average (Team member)"
const TEAM_MEMBER_WEEKLY_AVERAGE = "Weekly average (Team member)"
const INDUSTRY_DAILY_AVERAGE = "Daily average (Industry)"
const INDUSTRY_WEEKLY_AVERAGE = "Weekly average (Industry)"

const GRAPH_NAME_GITHUB_PR = "Code review response time"
const GRAPH_NAME_FOCUS_TIME = "Hours per day in big blocks"

var GraphIDTeamPR = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1}
var GraphIDIndividualPR = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2}
var GraphIDTeamFocusTime = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3}
var GraphIDIndividualFocusTime = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4}

var DataIDPRChartIndustryAverage = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5}
var DataIDPRChartTeamAverage = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6}
var DataIDPRChartUserAverage = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7}
var DataIDFocusTimeIndustryAverage = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8}
var DataIDFocusTimeTeamAverage = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9}
var DataIDFocusTimeUserAverage = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0}

var SubjectIDTeam = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1}

func (api *API) DashboardData(c *gin.Context) {
	logger := logging.GetSentryLogger()
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
	now := api.GetCurrentTime()
	lookbackDays := DEFAULT_LOOKBACK_DAYS + int(now.Weekday())
	dashboardDataPoints, err := database.GetDashboardDataPoints(api.DB, dashboardTeam.ID, now, lookbackDays)
	if err != nil || dashboardDataPoints == nil {
		Handle500(c)
		return
	}

	intervals := api.getWeekdayIntervalsFromLookbackDays(lookbackDays)

	subjects := []DashboardSubject{{
		ID:        SubjectIDTeam,
		Name:      "Your Team",
		Icon:      ICON_TEAM,
		GraphIDs:  []primitive.ObjectID{GraphIDTeamFocusTime, GraphIDTeamPR},
		IsDefault: true,
	}}
	for _, teamMember := range *dashboardTeamMembers {
		subjects = append(subjects, DashboardSubject{
			ID:       teamMember.ID,
			Name:     teamMember.Name,
			Icon:     ICON_USER,
			GraphIDs: []primitive.ObjectID{GraphIDIndividualFocusTime, GraphIDIndividualPR},
		})
	}

	data := make(map[primitive.ObjectID]map[primitive.ObjectID]map[primitive.ObjectID]DashboardData)
	for _, dataPoint := range *dashboardDataPoints {
		subjectID := SubjectIDTeam
		if dataPoint.IndividualID != primitive.NilObjectID {
			subjectID = dataPoint.IndividualID
		}
		intervalID := primitive.NilObjectID
		for _, interval := range intervals {
			if dataPoint.Date.Time().After(interval.DatetimeStart) && dataPoint.Date.Time().Before(interval.DatetimeEnd) {
				intervalID = interval.ID
			}
		}
		if intervalID == primitive.NilObjectID {
			// skip this data point because it doesn't fall into any of the intervals
			continue
		}
		var dataID primitive.ObjectID
		if dataPoint.GraphType == constants.DashboardGraphTypePRResponseTime {
			if subjectID == SubjectIDTeam {
				if dataPoint.TeamID == primitive.NilObjectID {
					dataID = DataIDPRChartIndustryAverage
				} else {
					dataID = DataIDPRChartTeamAverage
				}
			} else {
				dataID = DataIDPRChartUserAverage
			}
		} else if dataPoint.GraphType == constants.DashboardGraphTypeFocusTime {
			if subjectID == SubjectIDTeam {
				if dataPoint.TeamID == primitive.NilObjectID {
					dataID = DataIDFocusTimeIndustryAverage
				} else {
					dataID = DataIDFocusTimeTeamAverage
				}
			} else {
				dataID = DataIDFocusTimeUserAverage
			}
		} else {
			logger.Error().Msgf("invalid data point graph type value: '%s'", dataPoint.GraphType)
			continue
		}
		if _, exists := data[subjectID]; !exists {
			data[subjectID] = make(map[primitive.ObjectID]map[primitive.ObjectID]DashboardData)
		}
		if _, exists := data[subjectID][intervalID]; !exists {
			data[subjectID][intervalID] = make(map[primitive.ObjectID]DashboardData)
		}
		if _, exists := data[subjectID][intervalID][dataID]; !exists {
			data[subjectID][intervalID][dataID] = DashboardData{}
		}
		dashboardData := data[subjectID][intervalID][dataID]
		dashboardData.Points = append(dashboardData.Points, DashboardPoint{
			X: int(dataPoint.Date.Time().Unix()),
			Y: dataPoint.Value,
		})
		sort.Slice(dashboardData.Points, func(i, j int) bool {
			return dashboardData.Points[i].X < dashboardData.Points[j].X
		})
		data[subjectID][intervalID][dataID] = dashboardData
	}

	for subjectID := range data {
		for intervalID := range data[subjectID] {
			for dataID := range data[subjectID][intervalID] {
				total := 0
				dataSeries := data[subjectID][intervalID][dataID]
				points := dataSeries.Points
				if len(points) == 0 {
					logger.Error().Msgf("zero data points found: subjectID:'%s', intervalID:'%s', dataID:'%s'", subjectID.Hex(), intervalID.Hex(), dataID.Hex())
					continue
				}
				for _, point := range points {
					total += point.Y
				}
				dataSeries.AggregatedValue = total / len(dataSeries.Points)
				data[subjectID][intervalID][dataID] = dataSeries
			}
		}
	}

	c.JSON(200, DashboardResult{
		Intervals: intervals,
		Subjects:  subjects,
		Graphs:    getGraphs(),
		Data:      data,
	})
}

func (api *API) getWeekdayIntervalsFromLookbackDays(lookbackDays int) []DashboardInterval {
	now := api.GetCurrentTime()
	numIntervals := lookbackDays/NUM_DAYS_IN_WEEK + 1
	intervals := []DashboardInterval{}
	for index := 0; index < numIntervals; index++ {
		numDaysBackForMonday := NUM_DAYS_IN_WEEK*(numIntervals-index-1) + int(now.Weekday()) - 1
		monday := now.Add(-time.Hour * NUM_HOURS_IN_DAY * time.Duration(numDaysBackForMonday))
		mondayStartOfDay := primitive.NewDateTimeFromTime(time.Date(monday.Year(), monday.Month(), monday.Day(), constants.UTC_OFFSET, 0, 0, 0, time.UTC)).Time()

		numDaysBackForSaturday := numDaysBackForMonday - NUM_WEEKDAYS
		saturday := now.Add(-time.Hour * NUM_HOURS_IN_DAY * time.Duration(numDaysBackForSaturday))
		saturdayStartOfDay := primitive.NewDateTimeFromTime(time.Date(saturday.Year(), saturday.Month(), saturday.Day(), constants.UTC_OFFSET, 0, 0, 0, time.UTC)).Time()
		isDefault := index+1 == numIntervals
		intervals = append(intervals, DashboardInterval{
			ID:            primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, []byte(strconv.Itoa(index))[0]},
			DateStart:     mondayStartOfDay.Format("2006-01-02"),
			DateEnd:       saturdayStartOfDay.Format("2006-01-02"),
			DatetimeStart: mondayStartOfDay,
			DatetimeEnd:   saturdayStartOfDay,
			IsDefault:     isDefault,
		})
	}
	return intervals
}

func getGraphs() map[primitive.ObjectID]DashboardGraph {
	graphs := make(map[primitive.ObjectID]DashboardGraph)
	graphs[GraphIDTeamPR] = DashboardGraph{
		Name: GRAPH_NAME_GITHUB_PR,
		Icon: ICON_GITHUB,
		Lines: []DashboardLine{
			{
				Name:           TEAM_DAILY_AVERAGE,
				Color:          COLOR_PINK,
				AggregatedName: TEAM_WEEKLY_AVERAGE,
				DataID:         DataIDPRChartTeamAverage,
			},
			{
				Name:           INDUSTRY_DAILY_AVERAGE,
				Color:          COLOR_GRAY,
				AggregatedName: INDUSTRY_WEEKLY_AVERAGE,
				DataID:         DataIDPRChartIndustryAverage,
			},
		},
	}
	graphs[GraphIDTeamFocusTime] = DashboardGraph{
		Name: GRAPH_NAME_FOCUS_TIME,
		Icon: ICON_GCAL,
		Lines: []DashboardLine{
			{
				Name:           TEAM_DAILY_AVERAGE,
				Color:          COLOR_PINK,
				AggregatedName: TEAM_WEEKLY_AVERAGE,
				DataID:         DataIDFocusTimeTeamAverage,
			},
			{
				Name:           INDUSTRY_DAILY_AVERAGE,
				Color:          COLOR_GRAY,
				AggregatedName: INDUSTRY_WEEKLY_AVERAGE,
				DataID:         DataIDFocusTimeIndustryAverage,
			},
		},
	}
	graphs[GraphIDIndividualPR] = DashboardGraph{
		Name: GRAPH_NAME_GITHUB_PR,
		Icon: ICON_GITHUB,
		Lines: []DashboardLine{
			{
				Name:           TEAM_MEMBER_DAILY_AVERAGE,
				Color:          COLOR_BLUE,
				AggregatedName: TEAM_MEMBER_WEEKLY_AVERAGE,
				DataID:         DataIDPRChartUserAverage,
			},
			{
				Name:           TEAM_DAILY_AVERAGE,
				Color:          COLOR_GRAY,
				AggregatedName: TEAM_WEEKLY_AVERAGE,
				DataID:         DataIDPRChartTeamAverage,
				SubjectID:      &SubjectIDTeam,
			},
		},
	}
	graphs[GraphIDIndividualFocusTime] = DashboardGraph{
		Name: GRAPH_NAME_FOCUS_TIME,
		Icon: ICON_GCAL,
		Lines: []DashboardLine{
			{
				Name:           TEAM_MEMBER_DAILY_AVERAGE,
				Color:          COLOR_BLUE,
				AggregatedName: TEAM_MEMBER_WEEKLY_AVERAGE,
				DataID:         DataIDFocusTimeUserAverage,
			},
			{
				Name:           TEAM_DAILY_AVERAGE,
				Color:          COLOR_GRAY,
				AggregatedName: TEAM_WEEKLY_AVERAGE,
				DataID:         DataIDFocusTimeTeamAverage,
				SubjectID:      &SubjectIDTeam,
			},
		},
	}
	return graphs
}
