package api

import (
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestLinearCycleSerialization(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userID := primitive.NewObjectID()

	t.Run("NoCycle", func(t *testing.T) {
		result := api.taskToTaskResultV4(&database.Task{}, userID)
		assert.Nil(t, result.LinearCycle)
	})
	t.Run("CurrentCycle", func(t *testing.T) {
		// cycle begins yesterday, ends tomorrow
		startsAt := time.Now().AddDate(0, 0, -1)
		endsAt := time.Now().AddDate(0, 0, 1)
		result := api.taskToTaskResultV4(&database.Task{
			LinearCycle: database.LinearCycle{
				ID:       "5",
				Name:     "Current cycle",
				Number:   5,
				StartsAt: primitive.NewDateTimeFromTime(startsAt),
				EndsAt:   primitive.NewDateTimeFromTime(endsAt),
			},
		}, userID)
		expectedTaskResult := &TaskResultV4{
			LinearCycle: &LinearCycle{
				ID:             "5",
				Name:           "Current cycle",
				Number:         5,
				IsCurrentCycle: true,
			},
		}
		assertTaskResultsEqual(t, expectedTaskResult, result)
	})
	t.Run("PreviousCycle", func(t *testing.T) {
		// week-long cycle ended yesterday
		endsAt := time.Now().AddDate(0, 0, -1)
		startsAt := endsAt.AddDate(0, 0, -7)
		result := api.taskToTaskResultV4(&database.Task{
			LinearCycle: database.LinearCycle{
				ID:       "4",
				Name:     "Previous cycle",
				Number:   4,
				StartsAt: primitive.NewDateTimeFromTime(startsAt),
				EndsAt:   primitive.NewDateTimeFromTime(endsAt),
			},
		}, userID)
		expectedTaskResult := &TaskResultV4{
			LinearCycle: &LinearCycle{
				ID:              "4",
				Name:            "Previous cycle",
				Number:          4,
				IsPreviousCycle: true,
			},
		}
		assertTaskResultsEqual(t, expectedTaskResult, result)
	})
	t.Run("NextCycle", func(t *testing.T) {
		// week-long cycle starts tomorrow
		startsAt := time.Now().AddDate(0, 0, 1)
		endsAt := startsAt.AddDate(0, 0, 7)
		result := api.taskToTaskResultV4(&database.Task{
			LinearCycle: database.LinearCycle{
				ID:       "6",
				Name:     "Next cycle",
				Number:   6,
				StartsAt: primitive.NewDateTimeFromTime(startsAt),
				EndsAt:   primitive.NewDateTimeFromTime(endsAt),
			},
		}, userID)
		expectedTaskResult := &TaskResultV4{
			LinearCycle: &LinearCycle{
				ID:          "6",
				Name:        "Next cycle",
				Number:      6,
				IsNextCycle: true,
			},
		}
		assertTaskResultsEqual(t, expectedTaskResult, result)
	})
	t.Run("TwoCyclesAgo", func(t *testing.T) {
		// week-long cycle ended over a week ago
		endsAt := time.Now().AddDate(0, 0, -8)
		startsAt := endsAt.AddDate(0, 0, -15)
		result := api.taskToTaskResultV4(&database.Task{
			LinearCycle: database.LinearCycle{
				ID:       "3",
				Name:     "Two cycles ago",
				Number:   3,
				StartsAt: primitive.NewDateTimeFromTime(startsAt),
				EndsAt:   primitive.NewDateTimeFromTime(endsAt),
			},
		}, userID)
		expectedTaskResult := &TaskResultV4{
			LinearCycle: &LinearCycle{
				ID:     "3",
				Name:   "Two cycles ago",
				Number: 3,
			},
		}
		assertTaskResultsEqual(t, expectedTaskResult, result)
	})
	t.Run("TwoCyclesInTheFuture", func(t *testing.T) {
		// week-long cycle that will start in more than a week
		startsAt := time.Now().AddDate(0, 0, 8)
		endsAt := startsAt.AddDate(0, 0, 15)
		result := api.taskToTaskResultV4(&database.Task{
			LinearCycle: database.LinearCycle{
				ID:       "7",
				Name:     "Two cycles in the future",
				Number:   7,
				StartsAt: primitive.NewDateTimeFromTime(startsAt),
				EndsAt:   primitive.NewDateTimeFromTime(endsAt),
			},
		}, userID)
		expectedTaskResult := &TaskResultV4{
			LinearCycle: &LinearCycle{
				ID:     "7",
				Name:   "Two cycles in the future",
				Number: 7,
			},
		}
		assertTaskResultsEqual(t, expectedTaskResult, result)
	})
}

func assertTaskResultsEqual(t *testing.T, expected, actual *TaskResultV4) {
	assert.Equal(t, expected.ID, actual.ID)
	assert.Equal(t, expected.Title, actual.Title)
	assert.Equal(t, expected.Body, actual.Body)
	assert.Equal(t, expected.LinearCycle == nil, actual.LinearCycle == nil)
	if expected.LinearCycle != nil && actual.LinearCycle != nil {
		assert.Equal(t, expected.LinearCycle.ID, actual.LinearCycle.ID)
		assert.Equal(t, expected.LinearCycle.Name, actual.LinearCycle.Name)
		assert.Equal(t, expected.LinearCycle.Number, actual.LinearCycle.Number)
		assert.Equal(t, expected.LinearCycle.IsCurrentCycle, actual.LinearCycle.IsCurrentCycle)
		assert.Equal(t, expected.LinearCycle.IsPreviousCycle, actual.LinearCycle.IsPreviousCycle)
		assert.Equal(t, expected.LinearCycle.IsNextCycle, actual.LinearCycle.IsNextCycle)
	}
}
