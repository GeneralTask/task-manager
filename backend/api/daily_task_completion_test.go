package api

import (
	"context"
	"net/http"
	"net/url"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestGetDailyTaskCompletionList(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userID := primitive.NewObjectID()
	taskCollection := database.GetTaskCollection(api.DB)

	testTime := time.Date(2023, time.January, 4, 20, 0, 0, 0, time.UTC)
	api.OverrideTime = &testTime

	completedTrue := true
	completedFalse := false

	// Insert complete GT task
	_, err := taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      userID,
		IsCompleted: &completedTrue,
		CompletedAt: primitive.NewDateTimeFromTime(testTime),
		SourceID:    external.TASK_SOURCE_ID_GT_TASK,
	})
	assert.NoError(t, err)

	// Insert complete Linear task
	_, err = taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      userID,
		IsCompleted: &completedTrue,
		CompletedAt: primitive.NewDateTimeFromTime(testTime),
		SourceID:    external.TASK_SOURCE_ID_LINEAR,
	})
	assert.NoError(t, err)

	// Insert second complete GT task in next day
	_, err = taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      userID,
		IsCompleted: &completedTrue,
		CompletedAt: primitive.NewDateTimeFromTime(testTime.AddDate(0, 0, 1)),
		SourceID:    external.TASK_SOURCE_ID_GT_TASK,
	})
	assert.NoError(t, err)

	// Insert incomplete GT task
	_, err = taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      userID,
		IsCompleted: &completedFalse,
		SourceID:    external.TASK_SOURCE_ID_GT_TASK,
	})
	assert.NoError(t, err)

	// Insert completed GT task outside of date range
	_, err = taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      userID,
		IsCompleted: &completedTrue,
		CompletedAt: primitive.NewDateTimeFromTime(testTime.AddDate(1, 0, 0)),
		SourceID:    external.TASK_SOURCE_ID_GT_TASK,
	})
	assert.NoError(t, err)

	// Different user ID
	_, err = taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      primitive.NewObjectID(),
		IsCompleted: &completedTrue,
		CompletedAt: primitive.NewDateTimeFromTime(testTime),
		SourceID:    external.TASK_SOURCE_ID_GT_TASK,
	})
	assert.NoError(t, err)

	t.Run("Expect two days with count of 1", func(t *testing.T) {
		datetimeStart := testTime
		datetimeEnd := testTime.AddDate(0, 1, 0)

		result, err := api.GetDailyTaskCompletionList(userID, datetimeStart, datetimeEnd)
		assert.NoError(t, err)
		expectedResult := []DailyTaskCompletion{
			{
				Date: "2023-01-04",
				Sources: []TaskCompletionSource{
					{
						SourceID: external.TASK_SOURCE_ID_LINEAR,
						Count:    1,
					},
					{
						SourceID: external.TASK_SOURCE_ID_GT_TASK,
						Count:    1,
					},
				},
			},
			{
				Date: "2023-01-05",
				Sources: []TaskCompletionSource{
					{
						SourceID: external.TASK_SOURCE_ID_GT_TASK,
						Count:    1,
					},
				},
			},
		}
		assert.Equal(t, expectedResult, *result)
	})
}

func TestDailyTaskCompletionList(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	authToken := login("test_daily_task_completion_list@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, api.DB, authToken)

	testTime := time.Date(2023, time.January, 4, 20, 0, 0, 0, time.UTC)
	api.OverrideTime = &testTime

	datetimeStart := testTime
	datetimeEnd := testTime.AddDate(0, 1, 0)

	UnauthorizedTest(t, http.MethodGet, "/daily_task_completion/", nil)
	t.Run("MissingStartDate", func(t *testing.T) {
		body := ServeRequest(t, authToken, http.MethodGet, "/daily_task_completion/?datetime_end=2023-03-01T00:00:00.000-04:00", nil, http.StatusBadRequest, api)
		assert.Equal(t, `{"detail":"invalid or missing parameter"}`, string(body))
	})
	t.Run("MissingEndDate", func(t *testing.T) {
		body := ServeRequest(t, authToken, http.MethodGet, "/daily_task_completion/?datetime_start=2023-03-01T00:00:00.000-04:00", nil, http.StatusBadRequest, api)
		assert.Equal(t, `{"detail":"invalid or missing parameter"}`, string(body))
	})
	t.Run("BadParameter", func(t *testing.T) {
		params := url.Values{}
		params.Add("datetime_start", "bad")
		params.Add("datetime_end", "bad")
		body := ServeRequest(t, authToken, http.MethodGet, "/daily_task_completion/?datetime_start=bad&datetime_end=bad", nil, http.StatusBadRequest, api)
		assert.Equal(t, `{"detail":"invalid or missing parameter"}`, string(body))
	})
	t.Run("NoResults", func(t *testing.T) {
		params := url.Values{}
		params.Add("datetime_start", datetimeStart.Format(time.RFC3339))
		params.Add("datetime_end", datetimeEnd.Format(time.RFC3339))
		body := ServeRequest(t, authToken, http.MethodGet, "/daily_task_completion/?"+params.Encode(), nil, http.StatusOK, api)
		assert.Equal(t, `[]`, string(body))
	})
	t.Run("Success", func(t *testing.T) {
		isCompleted := true
		taskCollection := database.GetTaskCollection(api.DB)
		taskCollection.InsertOne(context.Background(), database.Task{
			UserID:      userID,
			IsCompleted: &isCompleted,
			CompletedAt: primitive.NewDateTimeFromTime(time.Date(2023, time.January, 4, 20, 0, 0, 0, time.UTC)),
			SourceID:    external.TASK_SOURCE_ID_GT_TASK,
		})

		params := url.Values{}
		params.Add("datetime_start", datetimeStart.Format(time.RFC3339))
		params.Add("datetime_end", datetimeEnd.Format(time.RFC3339))
		body := ServeRequest(t, authToken, http.MethodGet, "/daily_task_completion/?"+params.Encode(), nil, http.StatusOK, api)
		assert.Equal(t, `[{"date":"2023-01-04","sources":[{"count":1,"source_id":"gt_task"}]}]`, string(body))
	})
	t.Run("DifferentUser", func(t *testing.T) {
		differentUserAuthToken := login("bad_user_daily_task_completion@generaltask.com", "")
		isCompleted := true
		taskCollection := database.GetTaskCollection(api.DB)
		taskCollection.InsertOne(context.Background(), database.Task{
			UserID:      primitive.NewObjectID(),
			IsCompleted: &isCompleted,
			CompletedAt: primitive.NewDateTimeFromTime(time.Date(2023, time.January, 4, 20, 0, 0, 0, time.UTC)),
		})

		params := url.Values{}
		params.Add("datetime_start", datetimeStart.Format(time.RFC3339))
		params.Add("datetime_end", datetimeEnd.Format(time.RFC3339))
		body := ServeRequest(t, differentUserAuthToken, http.MethodGet, "/daily_task_completion/?"+params.Encode(), nil, http.StatusOK, api)
		assert.Equal(t, `[]`, string(body))
	})
}
