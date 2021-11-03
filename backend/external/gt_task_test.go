package external

import (
	"log"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestLoadGeneralTaskTasks(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID := primitive.NewObjectID()
	task := createTestTask(userID)
	taskWrongSource := createTestTask(userID)
	taskWrongSource.SourceID = TASK_SOURCE_ID_GCAL
	taskCompleted := createTestTask(userID)
	taskCompleted.IsCompleted = true
	insertTestTasks(
		t,
		db,
		userID,
		[]*database.Task{
			task,
			taskWrongSource,
			taskCompleted,
		},
	)

	t.Run("Success", func(t *testing.T) {
		var tasks = make(chan TaskResult)
		go GeneralTaskTaskSource{}.GetTasks(userID, DefaultAccountID, tasks)
		result := <-tasks
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.Tasks))
		// check IDExternal because ID is set upon db insertion
		assert.Equal(t, task.IDExternal, result.Tasks[0].IDExternal)
	})
	t.Run("WrongUserID", func(t *testing.T) {
		var tasks = make(chan TaskResult)
		go GeneralTaskTaskSource{}.GetTasks(primitive.NewObjectID(), DefaultAccountID, tasks)
		result := <-tasks
		assert.NoError(t, result.Error)
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("WrongSourceAccountID", func(t *testing.T) {
		var tasks = make(chan TaskResult)
		go GeneralTaskTaskSource{}.GetTasks(userID, "other_account_id", tasks)
		result := <-tasks
		assert.NoError(t, result.Error)
		assert.Equal(t, 0, len(result.Tasks))
	})
}

func createTestTask(userID primitive.ObjectID) *database.Task {
	return &database.Task{
		TaskBase: database.TaskBase{
			IDOrdering:      2,
			IDExternal:      primitive.NewObjectID().Hex(),
			IDTaskSection:   constants.IDTaskSectionToday,
			Title:           "Sample Taskeroni",
			SourceID:        TASK_SOURCE_ID_GT_TASK,
			UserID:          userID,
			SourceAccountID: DefaultAccountID,
		},
	}
}

func insertTestTasks(t *testing.T, db *mongo.Database, userID primitive.ObjectID, tasks []*database.Task) {
	for _, task := range tasks {
		log.Println("inserting task:", task)
		_, err := database.GetOrCreateTask(
			db,
			userID,
			task.IDExternal,
			task.SourceID,
			task,
		)
		assert.NoError(t, err)
	}
}
