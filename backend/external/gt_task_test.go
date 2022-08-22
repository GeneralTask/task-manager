package external

import (
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestLoadGeneralTaskTasks(t *testing.T) {
	userID := primitive.NewObjectID()
	task := createTestTask(userID)
	taskWrongSource := createTestTask(userID)
	taskWrongSource.SourceID = TASK_SOURCE_ID_GCAL
	taskCompleted := createTestTask(userID)
	completed := true
	taskCompleted.IsCompleted = &completed
	insertTestTasks(
		t,
		userID,
		[]*database.Task{
			task,
			taskWrongSource,
			taskCompleted,
		},
	)

	t.Run("Success", func(t *testing.T) {
		var tasks = make(chan TaskResult)
		go GeneralTaskTaskSource{}.GetTasks(userID, GeneralTaskDefaultAccountID, tasks)
		result := <-tasks
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.Tasks))
		// check IDExternal because ID is set upon db insertion
		assert.Equal(t, task.IDExternal, result.Tasks[0].IDExternal)
	})
	t.Run("WrongUserID", func(t *testing.T) {
		var tasks = make(chan TaskResult)
		go GeneralTaskTaskSource{}.GetTasks(primitive.NewObjectID(), GeneralTaskDefaultAccountID, tasks)
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

func TestCreateGeneralTaskTask(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	t.Run("SuccessMinimumFields", func(t *testing.T) {
		userID := primitive.NewObjectID()
		_, err := GeneralTaskTaskSource{}.CreateNewTask(userID, GeneralTaskDefaultAccountID, TaskCreationObject{
			Title: "send dogecoin to the moon",
		})
		assert.NoError(t, err)
		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		task := (*tasks)[0]
		assert.Equal(t, "send dogecoin to the moon", task.Title)
		assert.Equal(t, time.Hour.Nanoseconds(), task.TimeAllocation)
	})
	t.Run("SuccessAllTheFields", func(t *testing.T) {
		userID := primitive.NewObjectID()
		dueDate := time.Now()
		timeAllocation := (time.Duration(2) * time.Hour).Nanoseconds()
		_, err := GeneralTaskTaskSource{}.CreateNewTask(userID, GeneralTaskDefaultAccountID, TaskCreationObject{
			Title:          "send tesla stonk to the moon",
			Body:           "body",
			DueDate:        &dueDate,
			TimeAllocation: &timeAllocation,
		})
		assert.NoError(t, err)
		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		task := (*tasks)[0]
		assert.Equal(t, "send tesla stonk to the moon", *task.Title)
		assert.Equal(t, "body", *task.Body)
		assert.Equal(t, timeAllocation, *task.TimeAllocation)
	})
}

func createTestTask(userID primitive.ObjectID) *database.Task {
	title := "Sample Taskeroni"
	return &database.Task{
		IDOrdering:      2,
		IDExternal:      primitive.NewObjectID().Hex(),
		IDTaskSection:   constants.IDTaskSectionDefault,
		Title:           &title,
		SourceID:        TASK_SOURCE_ID_GT_TASK,
		UserID:          userID,
		SourceAccountID: GeneralTaskDefaultAccountID,
	}
}

func insertTestTasks(t *testing.T, userID primitive.ObjectID, tasks []*database.Task) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	for _, task := range tasks {
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
