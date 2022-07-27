package migrations

import (
	"context"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"testing"

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
	err = migrate.Steps(1)
	assert.NoError(t, err)
	userID := primitive.NewObjectID()

	t.Run("MigrateUp", func(t *testing.T) {
		tasksCollection := database.GetTaskCollection(db)
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:   userID,
				Title:    "task_1",
				SourceID: "gt",
			},
		})
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:   userID,
				Title:    "task_2",
				SourceID: "jira",
			},
		})
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:   userID,
				Title:    "task_3",
				SourceID: "asana_task",
			},
		})
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:   userID,
				Title:    "task_4",
				SourceID: "gmail",
			},
		})
		tasksCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:   userID,
				Title:    "task_5",
				SourceID: "gcal",
			},
		})

		err = migrate.Steps(1)
		assert.NoError(t, err)

		var tasks []database.Item
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

		err = migrate.Down()
		assert.NoError(t, err)

		count, err := tasksCollection.CountDocuments(dbCtx, bson.M{"task_type": bson.M{"$exists": false}})
		assert.NoError(t, err)
		assert.Equal(t, int64(4), count)
	})
}
