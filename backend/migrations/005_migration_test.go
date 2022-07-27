package migrations

import (
	"context"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"testing"
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
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:   userID,
				Title:    "task_1",
				SourceID: "asana_task",
			},
			TaskType: database.TaskType{IsTask: true},
		})
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:   userID,
				Title:    "task_2",
				SourceID: "asana_task",
			},
			TaskType: database.TaskType{IsTask: true},
		})
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:   userID,
				Title:    "task_3",
				SourceID: "linear_task",
			},
			TaskType: database.TaskType{IsTask: true},
		})
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:   userID,
				Title:    "task_4",
				SourceID: "gt",
			},
			TaskType: database.TaskType{IsTask: true},
		})

		err = migrate.Steps(1)
		assert.NoError(t, err)

		var tasks []database.Item
		cursor, err := tasksCollection.Find(dbCtx, bson.M{
			"$and": []bson.M{
				{"task_type.is_task": true},
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
		var tasks []database.Item
		cursor, err := tasksCollection.Find(dbCtx, bson.M{
			"$and": []bson.M{
				{"task_type.is_task": true},
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
