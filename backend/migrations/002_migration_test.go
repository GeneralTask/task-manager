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
		task1Title := "task_1"
		tasksCollection.InsertOne(dbCtx, database.Task{
			Title:    &task1Title,
			SourceID: "gt",
		})
		task2Title := "task_2"
		tasksCollection.InsertOne(dbCtx, database.Task{
			Title:    &task2Title,
			SourceID: "jira",
		})
		task3Title := "task_3"
		tasksCollection.InsertOne(dbCtx, database.Task{
			Title:    &task3Title,
			SourceID: "asana_task",
		})
		err = migrate.Steps(2)
		assert.NoError(t, err)

		var tasks []database.Task
		cursor, err := tasksCollection.Find(dbCtx, nil)
		assert.NoError(t, err)
		err = cursor.All(dbCtx, &tasks)
		assert.NoError(t, err)
		assert.Equal(t, int(3), len(tasks))

		expectedTitles := []string{"task_1", "task_2", "task_3"}
		for i, item := range tasks {
			assert.Equal(t, expectedTitles[i], item.Title)
		}
	})
	t.Run("MigrateDown", func(t *testing.T) {
		tasksCollection := database.GetTaskCollection(db)
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()

		err = migrate.Down()
		assert.NoError(t, err)

		count, err := tasksCollection.CountDocuments(dbCtx, bson.M{"task_type": bson.M{"$exists": false}})
		assert.NoError(t, err)
		assert.Equal(t, int64(5), count)
	})
}
