package migrations

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestMigrate005(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	migrate, err := getMigrate("")
	assert.NoError(t, err)
	err = migrate.Steps(1)
	assert.NoError(t, err)

	tasksCollection := database.GetTaskCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	userID := primitive.NewObjectID()

	t.Run("MigrateUp", func(t *testing.T) {
		task1Title := "task_1"
		tasksCollection.InsertOne(dbCtx, database.Task{
			UserID:   userID,
			Title:    &task1Title,
			SourceID: "asana_task",
		})
		task2Title := "task_2"
		tasksCollection.InsertOne(dbCtx, database.Task{
			UserID:   userID,
			Title:    &task2Title,
			SourceID: "asana_task",
		})
		task3Title := "task_3"
		tasksCollection.InsertOne(dbCtx, database.Task{
			UserID:   userID,
			Title:    &task3Title,
			SourceID: "linear_task",
		})
		task4Title := "task_4"
		tasksCollection.InsertOne(dbCtx, database.Task{
			UserID:   userID,
			Title:    &task4Title,
			SourceID: "gt",
		})

		err = migrate.Steps(1)
		assert.NoError(t, err)

		var tasks []database.Task
		cursor, err := tasksCollection.Find(dbCtx, bson.M{
			"$and": []bson.M{
				{"user_id": userID},
			},
		})
		assert.NoError(t, err)
		err = cursor.All(dbCtx, &tasks)
		assert.NoError(t, err)
		assert.Equal(t, int(2), len(tasks))

		expectedTitles := []string{"task_4", "task_3"}
		for i, item := range tasks {
			assert.Equal(t, expectedTitles[i], item.Title)
		}
	})
	t.Run("MigrateDown", func(t *testing.T) {
		var tasks []database.Task
		cursor, err := tasksCollection.Find(dbCtx, bson.M{
			"$and": []bson.M{
				{"user_id": userID},
			},
		})
		assert.NoError(t, err)
		err = cursor.All(dbCtx, &tasks)
		assert.NoError(t, err)
		assert.Equal(t, int(2), len(tasks))

		expectedTitles := []string{"task_4", "task_3"}
		for i, item := range tasks {
			assert.Equal(t, expectedTitles[i], item.Title)
		}
	})
}
