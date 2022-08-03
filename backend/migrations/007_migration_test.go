package migrations

import (
	"context"
	"github.com/GeneralTask/task-manager/backend/external"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestMigrate007(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	migrate, err := getMigrate("")
	assert.NoError(t, err)
	err = migrate.Steps(1)
	assert.NoError(t, err)

	externalTokenCollection := database.GetExternalTokenCollection(db)

	t.Run("MigrateUp", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		googleID := primitive.NewObjectID()
		externalTokenCollection.InsertOne(dbCtx, database.ExternalAPIToken{
			ID:         googleID,
			AccountID:  "test_migrate_007",
			ServiceID:  external.TASK_SERVICE_ID_GOOGLE,
			IsBadToken: false,
		})
		externalTokenCollection.InsertOne(dbCtx, database.ExternalAPIToken{
			ID:         primitive.NewObjectID(),
			AccountID:  "test_migrate_007",
			ServiceID:  external.TASK_SERVICE_ID_SLACK,
			IsBadToken: false,
		})

		err = migrate.Steps(1)
		assert.NoError(t, err)

		filter := bson.M{"account_id": "test_migrate_007", "is_bad_token": true}
		count, err := externalTokenCollection.CountDocuments(dbCtx, filter)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
		var result database.ExternalAPIToken
		err = externalTokenCollection.FindOne(dbCtx, filter).Decode(&result)
		assert.NoError(t, err)
		assert.Equal(t, external.TASK_SERVICE_ID_GOOGLE, result.ServiceID)
		assert.Equal(t, googleID, result.ID)
		assert.Equal(t, "{}", result.Token)
	})
	t.Run("MigrateDown", func(t *testing.T) {
		err = migrate.Steps(-1)
		assert.NoError(t, err)
	})
}
