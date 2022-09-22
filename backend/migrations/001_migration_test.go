package migrations

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestMigrate(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	migrate, err := getMigrate("")
	assert.NoError(t, err)

	t.Run("MigrateUp", func(t *testing.T) {
		externalTokenCollection := database.GetExternalTokenCollection(db)
		externalTokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
			ServiceID:      external.TASK_SERVICE_ID_GOOGLE,
			IsPrimaryLogin: false,
			IsUnlinkable:   false,
		})
		externalTokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
			ServiceID:      external.TASK_SERVICE_ID_GOOGLE,
			IsPrimaryLogin: true,
			IsUnlinkable:   false,
		})
		externalTokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
			ServiceID:      external.TASK_SERVICE_ID_SLACK,
			IsPrimaryLogin: true,
			IsUnlinkable:   false,
		})

		err = migrate.Steps(1)
		assert.NoError(t, err)

		count, err := externalTokenCollection.CountDocuments(context.Background(), bson.M{"is_unlinkable": true})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
		var result database.ExternalAPIToken
		err = externalTokenCollection.FindOne(context.Background(), bson.M{"is_unlinkable": true}).Decode(&result)
		assert.NoError(t, err)
		assert.Equal(t, external.TASK_SERVICE_ID_GOOGLE, result.ServiceID)
		assert.False(t, result.IsPrimaryLogin)
	})
	t.Run("MigrateDown", func(t *testing.T) {
		externalTokenCollection := database.GetExternalTokenCollection(db)
		_, err := externalTokenCollection.UpdateMany(context.Background(), bson.M{}, bson.M{"$set": bson.M{"is_unlinkable": true}})
		assert.NoError(t, err)

		err = migrate.Down()
		assert.NoError(t, err)

		count, err := externalTokenCollection.CountDocuments(context.Background(), bson.M{"is_unlinkable": false})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
		var result database.ExternalAPIToken
		err = externalTokenCollection.FindOne(context.Background(), bson.M{"is_unlinkable": false}).Decode(&result)
		assert.NoError(t, err)
		assert.Equal(t, external.TASK_SERVICE_ID_GOOGLE, result.ServiceID)
		assert.False(t, result.IsPrimaryLogin)
	})
}
