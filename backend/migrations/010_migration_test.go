package migrations

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/external"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestMigrate010(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	migrate, err := getMigrate("")
	assert.NoError(t, err)
	err = migrate.Steps(1)
	assert.NoError(t, err)

	taskCollection := database.GetTaskCollection(db)

	t.Run("MigrateUp", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		taskID := primitive.NewObjectID()
		taskCollection.InsertOne(dbCtx, database.Task{
			ID:       taskID,
			SourceID: external.TASK_SOURCE_ID_GCAL,
		})
		task2ID := primitive.NewObjectID()
		taskCollection.InsertOne(dbCtx, database.Task{
			ID:       task2ID,
			SourceID: external.TASK_SOURCE_ID_LINEAR,
		})

		filter := bson.M{}
		count, err := taskCollection.CountDocuments(dbCtx, filter)
		assert.NoError(t, err)
		assert.Equal(t, int64(2), count)

		err = migrate.Steps(1)
		assert.NoError(t, err)

		count, err = taskCollection.CountDocuments(dbCtx, filter)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
		var result database.Task
		err = taskCollection.FindOne(dbCtx, filter).Decode(&result)
		assert.NoError(t, err)
		assert.Equal(t, external.TASK_SOURCE_ID_LINEAR, result.SourceID)
	})
	t.Run("MigrateDown", func(t *testing.T) {
		err = migrate.Steps(-1)
		assert.NoError(t, err)
	})
}
