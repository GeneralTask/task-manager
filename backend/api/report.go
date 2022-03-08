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

	// fetch all users
	var users []database.User
	userCollection := database.GetUserCollection(db)
	userCursor, err := userCollection.Find(dbCtx, bson.M{})
	if err != nil {
		Handle500(c)
		return
	}
	err = userCursor.All(dbCtx, &users)
	if err != nil {
		Handle500(c)
		return
	}
	// make a map from user id to user
	userMap := make(map[string]database.User)
	for _, user := range users {
		userMap[user.ID.Hex()] = user
	}

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
		userID := logEvent.UserID.Hex()
		logEventsByUser[userID] = append(logEventsByUser[userID], logEvent)
	}
	// output number of users per day
	userCounts := make(map[string]map[string]map[string]int)
	for userID, logEvents := range logEventsByUser {
		email := userMap[userID].Email
		userCounts[email] = make(map[string]map[string]int)
		for _, logEvent := range logEvents {
			createdDate := logEvent.CreatedAt.Time().Format("2006-01-02")
			if userCounts[email][createdDate] == nil {
				userCounts[email][createdDate] = make(map[string]int)
			}
			userCounts[userMap[userID].Email][createdDate][logEvent.EventType]++
		}
	}
	c.JSON(200, gin.H{"user_counts": userCounts})
}
