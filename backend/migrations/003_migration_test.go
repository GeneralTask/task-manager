package migrations

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestMigrate003(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	migrate, err := getMigrate("")
	assert.NoError(t, err)
	err = migrate.Steps(2)
	assert.NoError(t, err)
	externalTokenCollection := database.GetExternalTokenCollection(db)

	t.Run("MigrateUp", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		externalTokenCollection.InsertOne(dbCtx, database.ExternalAPIToken{
			ID:             primitive.ObjectID{1},
			AccountID:      "test_migrate_003",
			ServiceID:      external.TASK_SERVICE_ID_GOOGLE,
			IsPrimaryLogin: false,
			IsUnlinkable:   false,
		})
		externalTokenCollection.InsertOne(dbCtx, database.ExternalAPIToken{
			ID:             primitive.ObjectID{2},
			AccountID:      "test_migrate_003",
			ServiceID:      external.TASK_SERVICE_ID_GOOGLE,
			IsPrimaryLogin: true,
			IsUnlinkable:   false,
		})
		externalTokenCollection.InsertOne(dbCtx, database.ExternalAPIToken{
			ID:             primitive.ObjectID{3},
			AccountID:      "test_migrate_003",
			ServiceID:      external.TASK_SERVICE_ID_SLACK,
			IsPrimaryLogin: true,
			IsUnlinkable:   false,
		})

		err = migrate.Steps(1)
		assert.NoError(t, err)

		filter := bson.M{"$and": []bson.M{{"is_unlinkable": true}, {"account_id": "test_migrate_003"}}}
		count, err := externalTokenCollection.CountDocuments(dbCtx, filter)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
		var result database.ExternalAPIToken
		err = externalTokenCollection.FindOne(dbCtx, filter).Decode(&result)
		assert.NoError(t, err)
		assert.Equal(t, external.TASK_SERVICE_ID_GOOGLE, result.ServiceID)
		assert.Equal(t, primitive.ObjectID{2}, result.ID)
		assert.True(t, result.IsPrimaryLogin)
	})
	t.Run("MigrateDown", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		_, err := externalTokenCollection.UpdateMany(dbCtx, bson.M{"account_id": "test_migrate_003"}, bson.M{"$set": bson.M{"is_unlinkable": true}})
		assert.NoError(t, err)

		err = migrate.Steps(-1)
		assert.NoError(t, err)

		filter := bson.M{"$and": []bson.M{{"is_unlinkable": false}, {"account_id": "test_migrate_003"}}}
		count, err := externalTokenCollection.CountDocuments(dbCtx, filter)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
		var result database.ExternalAPIToken
		err = externalTokenCollection.FindOne(dbCtx, filter).Decode(&result)
		assert.NoError(t, err)
		assert.Equal(t, external.TASK_SERVICE_ID_GOOGLE, result.ServiceID)
		assert.Equal(t, primitive.ObjectID{2}, result.ID)
		assert.True(t, result.IsPrimaryLogin)
	})
}
