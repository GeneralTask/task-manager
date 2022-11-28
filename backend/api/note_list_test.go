package api

import (
	"context"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"testing"
)

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
