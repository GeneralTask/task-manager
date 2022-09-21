package migrations

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/external"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/database"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestMigrate008(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	migrate, err := getMigrate("")
	assert.NoError(t, err)
	err = migrate.Steps(1)
	assert.NoError(t, err)

	taskCollection := database.GetTaskCollection(db)

	t.Run("MigrateUp", func(t *testing.T) {
		taskID := primitive.NewObjectID()
		taskCollection.InsertOne(context.Background(), database.Task{
			ID:       taskID,
			SourceID: external.TASK_SOURCE_ID_GITHUB_PR,
		})
		task2ID := primitive.NewObjectID()
		taskCollection.InsertOne(context.Background(), database.Task{
			ID:       task2ID,
			SourceID: external.TASK_SOURCE_ID_LINEAR,
		})

		filter := bson.M{}
		count, err := taskCollection.CountDocuments(context.Background(), filter)
		assert.NoError(t, err)
		assert.Equal(t, int64(2), count)

		err = migrate.Steps(1)
		assert.NoError(t, err)

		count, err = taskCollection.CountDocuments(context.Background(), filter)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
		var result database.Task
		err = taskCollection.FindOne(context.Background(), filter).Decode(&result)
		assert.NoError(t, err)
		assert.Equal(t, external.TASK_SOURCE_ID_LINEAR, result.SourceID)

		// clear DB for next test
		taskCollection.DeleteMany(context.Background(), filter)
	})
	t.Run("MigrateDown", func(t *testing.T) {
		err = migrate.Steps(-1)
		assert.NoError(t, err)
	})
}
