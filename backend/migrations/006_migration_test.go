package migrations

import (
	"context"
	"testing"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestMigrate006(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	migrate, err := getMigrate("")
	assert.NoError(t, err)
	userID := primitive.NewObjectID()

	t.Run("MigrateUp", func(t *testing.T) {
		tasksCollection := database.GetTaskCollection(db)
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		task1Title := "task_1"
		tasksCollection.InsertOne(dbCtx, database.Task{
			UserID:   userID,
			Title:    &task1Title,
			SourceID: "gt",
		})
		task2Title := "task_2"
		tasksCollection.InsertOne(dbCtx, database.Task{
			UserID:   userID,
			Title:    &task2Title,
			SourceID: "jira",
		})
		task3Title := "task_3"
		tasksCollection.InsertOne(dbCtx, database.Task{
			UserID:   userID,
			Title:    &task3Title,
			SourceID: "asana_task",
		})
		task4Title := "task_4"
		tasksCollection.InsertOne(dbCtx, database.Task{
			UserID:   userID,
			Title:    &task4Title,
			SourceID: "gmail",
		})
		task5Title := "task_5"
		tasksCollection.InsertOne(dbCtx, database.Task{
			UserID:   userID,
			Title:    &task5Title,
			SourceID: "gcal",
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
		assert.Equal(t, int(4), len(tasks))

		expectedTitles := []string{"task_3", "task_5", "task_1", "task_2"}
		for i, item := range tasks {
			assert.Equal(t, expectedTitles[i], item.Title)
		}
	})
	t.Run("MigrateDown", func(t *testing.T) {
		tasksCollection := database.GetTaskCollection(db)
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()

		err = migrate.Steps(-1)
		assert.NoError(t, err)

		count, err := tasksCollection.CountDocuments(dbCtx, bson.M{
			"$and": []bson.M{
				{"user_id": userID},
			},
		})
		assert.NoError(t, err)
		assert.Equal(t, int64(4), count)
	})
}
