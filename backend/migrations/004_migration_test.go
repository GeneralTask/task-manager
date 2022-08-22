package migrations

import (
	"context"
	"testing"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func TestMigrate004(t *testing.T) {
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

		indexes := getIndexes(dbCtx, taskCollection)
		assert.Equal(t, 1, len(indexes)) // The default _id_ index is automatically created

		err = migrate.Steps(1)
		assert.NoError(t, err)

		indexes = getIndexes(dbCtx, taskCollection)
		assert.Equal(t, 4, len(indexes))

		assert.Equal(t, primitive.M{"id_external": int32(1), "source_id": int32(1), "user_id": int32(1)}, indexes[1]["key"])
		assert.Equal(t, primitive.M{"email.is_unread": int32(1), "task_type.is_message": int32(1), "user_id": int32(1)}, indexes[3]["key"])
	})
	t.Run("MigrateDown", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()

		indexes := getIndexes(dbCtx, taskCollection)
		assert.Equal(t, 4, len(indexes))

		err = migrate.Steps(-1)
		assert.NoError(t, err)

		indexes = getIndexes(dbCtx, taskCollection)
		assert.Equal(t, 1, len(indexes))
	})
}

func getIndexes(ctx context.Context, collection *mongo.Collection) []bson.M {
	indexView := collection.Indexes()
	opts := options.ListIndexes().SetMaxTime(2 * time.Second)
	cursor, err := indexView.List(ctx, opts)
	if err != nil {
		log.Fatal().Err(err).Send()
	}

	var result []bson.M
	if err = cursor.All(ctx, &result); err != nil {
		log.Fatal().Err(err).Send()
	}
	return result
}
