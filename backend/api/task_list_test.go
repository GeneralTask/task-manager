package api

import (
	"context"
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
		priority := 3.0
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
		allStatuses := []*database.ExternalTaskStatus{
			&externalStatus,
		}

		result := api.taskBaseToTaskResult(&database.Task{
			SourceID:           external.TASK_SOURCE_ID_LINEAR,
			DueDate:            &primitiveDueDate,
			PriorityNormalized: &priority,
			TimeAllocation:     &timeAllocation,
			IsCompleted:        &notCompleted,
			Title:              &title,
			Body:               &body,
			Status:             &externalStatus,
			SlackMessageParams: &slackMessageParams,
			AllStatuses:        allStatuses,
		}, userID)
		// TODO change to a helper method to compare taskResults
		assert.Equal(t, primitiveDueDate.Time().Format("2006-01-02"), result.DueDate)
		assert.Equal(t, timeAllocation, result.TimeAllocation)
		assert.False(t, result.IsDone)
		assert.Equal(t, title, result.Title)
		assert.Equal(t, body, result.Body)
		assert.Equal(t, externalStatus.State, result.ExternalStatus.State)
		assert.Equal(t, slackMessageParams.Channel.ID, result.SlackMessageParams.Channel.ID)
		assert.Equal(t, priority, result.PriorityNormalized)
		assert.Equal(t, 1, len(result.AllStatuses))
		assert.Equal(t, externalStatus.Type, result.AllStatuses[0].Type)
	})
}

func TestTaskListToTaskResultList(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userID := primitive.NewObjectID()
	t.Run("SubtaskSuccess", func(t *testing.T) {
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

		parentTaskID := primitive.NewObjectID()
		results := api.taskListToTaskResultList(&[]database.Task{
			{
				ID:                 parentTaskID,
				UserID:             userID,
				SourceID:           external.TASK_SOURCE_ID_LINEAR,
				DueDate:            &primitiveDueDate,
				TimeAllocation:     &timeAllocation,
				IsCompleted:        &notCompleted,
				Title:              &title,
				Body:               &body,
				Status:             &externalStatus,
				SlackMessageParams: &slackMessageParams,
			},
			{
				UserID:        userID,
				IsCompleted:   &notCompleted,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_LINEAR,
				ParentTaskID:  parentTaskID,
			}}, userID)

		result := results[0]
		// TODO change to a helper method to compare taskResults
		assert.Equal(t, primitiveDueDate.Time().Format("2006-01-02"), result.DueDate)
		assert.Equal(t, timeAllocation, result.TimeAllocation)
		assert.False(t, result.IsDone)
		assert.Equal(t, title, result.Title)
		assert.Equal(t, body, result.Body)
		assert.Equal(t, externalStatus.State, result.ExternalStatus.State)
		assert.Equal(t, slackMessageParams.Channel.ID, result.SlackMessageParams.Channel.ID)
		assert.Equal(t, 1, len(result.SubTasks))
	})
}

func TestGetSubtaskResults(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

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

	userID := primitive.NewObjectID()
	t.Run("NoSubtasks", func(t *testing.T) {
		results := api.getSubtaskResults(
			&database.Task{
				ID:                 primitive.NewObjectID(),
				UserID:             userID,
				SourceID:           external.TASK_SOURCE_ID_LINEAR,
				DueDate:            &primitiveDueDate,
				TimeAllocation:     &timeAllocation,
				IsCompleted:        &notCompleted,
				Title:              &title,
				Body:               &body,
				Status:             &externalStatus,
				SlackMessageParams: &slackMessageParams,
			}, userID)
		assert.Equal(t, 0, len(results))
	})
	t.Run("SubtaskSuccess", func(t *testing.T) {
		parentCtx := context.Background()
		taskCollection := database.GetTaskCollection(api.DB)
		parentTaskID := primitive.NewObjectID()
		insertResult, err := taskCollection.InsertOne(parentCtx, database.Task{
			UserID:        userID,
			IsCompleted:   &notCompleted,
			IDTaskSection: primitive.NilObjectID,
			SourceID:      external.TASK_SOURCE_ID_LINEAR,
			ParentTaskID:  parentTaskID,
		})
		assert.NoError(t, err)

		results := api.getSubtaskResults(
			&database.Task{
				ID:                 parentTaskID,
				UserID:             userID,
				SourceID:           external.TASK_SOURCE_ID_LINEAR,
				DueDate:            &primitiveDueDate,
				TimeAllocation:     &timeAllocation,
				IsCompleted:        &notCompleted,
				Title:              &title,
				Body:               &body,
				Status:             &externalStatus,
				SlackMessageParams: &slackMessageParams,
			}, userID)
		assert.Equal(t, 1, len(results))
		assert.Equal(t, insertResult.InsertedID.(primitive.ObjectID), results[0].ID)
	})

}
