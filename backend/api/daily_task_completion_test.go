package api

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// func TestGetDailyTaskCompletionList(t *testing.T) {
// 	api, dbCleanup := GetAPIWithDBCleanup()
// 	defer dbCleanup()

// 	authToken := login("daily_task_completion_list")
// }

func TestDailyTaskCompletionList(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	authToken := login("daily_task_completion@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, api.DB, authToken)
	taskCollection := database.GetTaskCollection(api.DB)

	completedTrue := true
	completedFalse := false

	// Insert complete task
	_, err := taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      userID,
		IsCompleted: &completedTrue,
		CompletedAt: primitive.NewDateTimeFromTime(time.Now()),
	})
	assert.NoError(t, err)
	// Insert second complete task in next day
	_, err = taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      userID,
		IsCompleted: &completedTrue,
		CompletedAt: primitive.NewDateTimeFromTime(time.Now().AddDate(0,0,1)),
	})
	assert.NoError(t, err)
	// Insert incomplete task
	_, err = taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      userID,
		IsCompleted: &completedFalse,
	})
	assert.NoError(t, err)
	// Insert completed task outside of date range
	_, err = taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      userID,
		IsCompleted: &completedTrue,
		CompletedAt: primitive.NewDateTimeFromTime(time.Now().AddDate(1, 0, 0)),
	})
	assert.NoError(t, err)

	t.Run("Expect two days with count of 1", func(t *testing.T) {
		datetimeStart := time.Now()
		datetimeEnd := time.Now().AddDate(0, 1, 0)

		params := url.Values{}
		params.Add("datetime_start", datetimeStart.Format(time.RFC3339))
		params.Add("datetime_end", datetimeEnd.Format(time.RFC3339))

		response := ServeRequest(t, authToken, "GET", "/daily_task_completion/?" + params.Encode(), nil, http.StatusOK, api)
		var dailyTaskCompletionList []DailyTaskCompletion
		err := json.Unmarshal(response, &dailyTaskCompletionList)
		assert.NoError(t, err)
		assert.Equal(t, 2, len(dailyTaskCompletionList))
		assert.Equal(t, "2020-01-01", dailyTaskCompletionList[0].Date)
		assert.Equal(t, "2020-01-02", dailyTaskCompletionList[1].Date)
		assert.Equal(t, 1, dailyTaskCompletionList[0].Count)
		assert.Equal(t, 1, dailyTaskCompletionList[1].Count)

	})
}
