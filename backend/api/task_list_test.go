package api

import (
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestTaskBaseToTaskResult(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userID := primitive.NewObjectID()
	t.Run("NoSourceID", func(t *testing.T) {
		dueDate := time.Unix(0, 0)
		primitiveDueDate := primitive.NewDateTimeFromTime(dueDate)
		result := api.taskBaseToTaskResult(&database.Task{
			SourceID: "invalid source",
			DueDate:  &primitiveDueDate,
		}, userID)
		assert.Equal(t, "", result.DueDate)
	})
	t.Run("InvalidDueDate", func(t *testing.T) {
		dueDate := time.Unix(0, 0)
		primitiveDueDate := primitive.NewDateTimeFromTime(dueDate)
		result := api.taskBaseToTaskResult(&database.Task{
			SourceID: external.TASK_SOURCE_ID_LINEAR,
			DueDate:  &primitiveDueDate,
		}, userID)
		assert.Equal(t, "", result.DueDate)
	})
	t.Run("ValidDueDate", func(t *testing.T) {
		dueDate := time.Unix(420, 0)
		primitiveDueDate := primitive.NewDateTimeFromTime(dueDate)
		result := api.taskBaseToTaskResult(&database.Task{
			SourceID: external.TASK_SOURCE_ID_LINEAR,
			DueDate:  &primitiveDueDate,
		}, userID)
		assert.Equal(t, primitiveDueDate.Time().Format("2006-01-02"), result.DueDate)
	})
	t.Run("AllFieldSuccess", func(t *testing.T) {
		dueDate := time.Unix(420, 0)
		timeAllocation := int64(420)
		primitiveDueDate := primitive.NewDateTimeFromTime(dueDate)
		notCompleted := false
		title := "hello!"
		body := "example body"
		externalStatus := database.ExternalTaskStatus{
			ExternalID: "example ID",
			State:      "example state",
			Type:       "example type",
		}
		slackMessageParams := database.SlackMessageParams{
			Channel: database.SlackChannel{
				ID: "slackID",
			},
		}

		result := api.taskBaseToTaskResult(&database.Task{
			SourceID:           external.TASK_SOURCE_ID_LINEAR,
			DueDate:            &primitiveDueDate,
			TimeAllocation:     &timeAllocation,
			IsCompleted:        &notCompleted,
			Title:              &title,
			Body:               &body,
			Status:             &externalStatus,
			SlackMessageParams: &slackMessageParams,
		}, userID)
		// TODO change to a helper method to compare taskResults
		assert.Equal(t, primitiveDueDate.Time().Format("2006-01-02"), result.DueDate)
		assert.Equal(t, timeAllocation, result.TimeAllocation)
		assert.False(t, result.IsDone)
		assert.Equal(t, title, result.Title)
		assert.Equal(t, body, result.Body)
		assert.Equal(t, externalStatus.State, result.ExternalStatus.State)
		assert.Equal(t, slackMessageParams.Channel.ID, result.SlackMessageParams.Channel.ID)
	})
}
