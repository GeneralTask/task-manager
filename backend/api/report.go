package api

import (
	"context"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func (api *API) ReportGenerate(c *gin.Context) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	logEvents := database.GetLogEventsCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	sevenDaysAgo := time.Now().AddDate(0, 0, -7)
	logEventsCursor, err := logEvents.Find(dbCtx, bson.M{"created_at": bson.M{"$gte": sevenDaysAgo}})
	if err != nil {
		Handle500(c)
		return
	}
	var logEventsList []database.LogEvent
	if err := logEventsCursor.All(dbCtx, &logEventsList); err != nil {
		Handle500(c)
		return
	}
	// bin log events by day by unique user ids
	logEventsByUser := make(map[string][]database.LogEvent)
	for _, logEvent := range logEventsList {
		logEventsByUser[logEvent.UserID.Hex()] = append(logEventsByUser[logEvent.UserID.Hex()], logEvent)
	}
	// output number of users per day
	userCounts := make(map[string]int)
	for _, logEvents := range logEventsByUser {
		userCounts[logEvents[0].CreatedAt.Time().Format("2006-01-02")]++
	}
	c.JSON(200, gin.H{"user_counts": userCounts})
}
