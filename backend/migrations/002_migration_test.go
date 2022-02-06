package migrations

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestMigrate002(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	migrate, err := getMigrate("")
	assert.NoError(t, err)

	t.Run("MigrateUp", func(t *testing.T) {
		tasksCollection := database.GetTaskCollection(db)
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				Title:    "task_1",
				SourceID: "gt",
			},
		})
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				Title:    "task_2",
				SourceID: "jira",
			},
		})
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				Title:    "task_3",
				SourceID: "asana_task",
			},
		})
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				Title:    "task_4",
				SourceID: "gmail",
			},
		})
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				Title:    "task_5",
				SourceID: "gcal",
			},
		})

		err = migrate.Steps(2)
		assert.NoError(t, err)

		var tasks []database.Item
		cursor, err := tasksCollection.Find(dbCtx, bson.M{"task_type.is_task": true})
		assert.NoError(t, err)
		err = cursor.All(dbCtx, &tasks)
		assert.NoError(t, err)
		assert.Equal(t, int(3), len(tasks))

		expectedResult := []string{"task_1", "task_2", "task_3"}
		var actualResult []string
		for _, item := range tasks {
			actualResult = append(actualResult, item.Title)
		}
		assert.Equal(t, expectedResult, actualResult)

		var messages []database.Item
		cursor, err = tasksCollection.Find(dbCtx, bson.M{"task_type.is_message": true})
		assert.NoError(t, err)
		err = cursor.All(dbCtx, &messages)
		assert.NoError(t, err)
		assert.Equal(t, int(1), len(messages))
		assert.Equal(t, "task_4", messages[0].Title)

		var events []database.Item
		cursor, err = tasksCollection.Find(dbCtx, bson.M{"task_type.is_event": true})
		assert.NoError(t, err)
		err = cursor.All(dbCtx, &events)
		assert.NoError(t, err)
		assert.Equal(t, int(1), len(events))
		assert.Equal(t, "task_5", events[0].Title)
	})
	t.Run("MigrateDown", func(t *testing.T) {
	})
}
