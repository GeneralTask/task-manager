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
		assert.Equal(t, primitiveDueDate.Time().UTC().Format("2006-01-02"), result.DueDate)
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
			Color:      "#ffffff",
		}
		slackMessageParams := database.SlackMessageParams{
			Channel: database.SlackChannel{
				ID: "slackID",
			},
		}
		allStatuses := []*database.ExternalTaskStatus{
			&externalStatus,
		}

		externalPriority := database.ExternalTaskPriority{
			ExternalID:         "example ID",
			Name:               "example name",
			PriorityNormalized: 3.0,
			IconURL:            "https://example.com",
			Color:              "#ffffff",
		}
		allPriorities := []*database.ExternalTaskPriority{
			&externalPriority,
		}

		result := api.taskBaseToTaskResult(&database.Task{
			SourceID:              external.TASK_SOURCE_ID_LINEAR,
			DueDate:               &primitiveDueDate,
			PriorityNormalized:    &priority,
			TimeAllocation:        &timeAllocation,
			IsCompleted:           &notCompleted,
			Title:                 &title,
			Body:                  &body,
			Status:                &externalStatus,
			SlackMessageParams:    &slackMessageParams,
			AllStatuses:           allStatuses,
			ExternalPriority:      &externalPriority,
			AllExternalPriorities: allPriorities,
		}, userID)
		// TODO change to a helper method to compare taskResults
		assert.Equal(t, primitiveDueDate.Time().UTC().Format("2006-01-02"), result.DueDate)
		assert.Equal(t, timeAllocation, result.TimeAllocation)
		assert.False(t, result.IsDone)
		assert.Equal(t, title, result.Title)
		assert.Equal(t, body, result.Body)
		assert.Equal(t, externalStatus.State, result.ExternalStatus.State)
		assert.Equal(t, slackMessageParams.Channel.ID, result.SlackMessageParams.Channel.ID)
		assert.Equal(t, priority, result.PriorityNormalized)
		assert.Equal(t, 1, len(result.AllStatuses))
		assert.Equal(t, externalStatus.Type, result.AllStatuses[0].Type)
		assert.Equal(t, externalStatus.Color, result.AllStatuses[0].Color)
		assert.Equal(t, 1, len(result.AllExternalPriorities))
		assert.Equal(t, externalPriority.Name, result.AllExternalPriorities[0].Name)
		assert.Equal(t, externalPriority.PriorityNormalized, result.AllExternalPriorities[0].PriorityNormalized)
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
		assert.Equal(t, primitiveDueDate.Time().UTC().Format("2006-01-02"), result.DueDate)
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
		taskCollection := database.GetTaskCollection(api.DB)
		parentTaskID := primitive.NewObjectID()
		insertResult, err := taskCollection.InsertOne(context.Background(), database.Task{
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

func TestUpdateLastFullRefreshTime(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userID := primitive.NewObjectID()
	accountID := "test@generaltask.com"

	collection := database.GetExternalTokenCollection(api.DB)
	token := database.ExternalAPIToken{
		UserID:     userID,
		AccountID:  accountID,
		ServiceID:  external.TASK_SERVICE_ID_LINEAR,
		ExternalID: "external",
	}
	collection.InsertOne(context.Background(), token)

	t.Run("Success", func(t *testing.T) {
		err := api.updateLastFullRefreshTime(token)
		assert.NoError(t, err)

		response := database.FindOneExternalWithCollection(collection, userID, "external")
		var tokenDB database.ExternalAPIToken
		response.Decode(&tokenDB)
		assert.Less(t, (15 * time.Minute), time.Now().Sub(tokenDB.LastFullRefreshTime.Time()))
	})
}

func TestGetActiveLinearTasksFromDBForToken(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userID := primitive.NewObjectID()
	accountID := "test@generaltask.com"

	collection := database.GetTaskCollection(api.DB)
	_notCompleted := false
	// not completed, not deleted
	task := database.Task{
		UserID:          userID,
		SourceAccountID: accountID,
		SourceID:        external.TASK_SOURCE_ID_LINEAR,
		IsCompleted:     &_notCompleted,
	}
	collection.InsertOne(context.Background(), task)

	// not completed, deleted
	_deleted := true
	task = database.Task{
		UserID:          userID,
		SourceAccountID: accountID,
		SourceID:        external.TASK_SOURCE_ID_LINEAR,
		IsCompleted:     &_notCompleted,
		IsDeleted:       &_deleted,
	}
	collection.InsertOne(context.Background(), task)

	// completed, not deleted
	_completed := true
	task = database.Task{
		UserID:          userID,
		SourceAccountID: accountID,
		SourceID:        external.TASK_SOURCE_ID_LINEAR,
		IsCompleted:     &_completed,
	}
	collection.InsertOne(context.Background(), task)

	t.Run("Success", func(t *testing.T) {
		var tasks = make(chan external.TaskResult)
		go api.getActiveLinearTasksFromDBForToken(userID, accountID, tasks)
		taskResult := <-tasks
		assert.Equal(t, 1, len(taskResult.Tasks))
	})
}
