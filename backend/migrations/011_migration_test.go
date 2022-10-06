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

func TestMigrate011(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	migrate, err := getMigrate("")
	assert.NoError(t, err)
	err = migrate.Steps(1)
	assert.NoError(t, err)

	externalTokenCollection := database.GetExternalTokenCollection(db)

	t.Run("MigrateUp", func(t *testing.T) {
		linearID := primitive.NewObjectID()
		externalTokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
			ID:         linearID,
			AccountID:  "test_migrate_11",
			ServiceID:  external.TASK_SERVICE_ID_LINEAR,
			IsBadToken: false,
			Token:      "{ linear-token-string }",
		})
		slackID := primitive.NewObjectID()
		externalTokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
			ID:         slackID,
			AccountID:  "test_migrate_11",
			ServiceID:  external.TASK_SERVICE_ID_SLACK,
			IsBadToken: false,
			Token:      "{ slack-token-string }",
		})

		err = migrate.Steps(1)
		assert.NoError(t, err)

		filter := bson.M{"account_id": "test_migrate_11", "is_bad_token": true}
		count, err := externalTokenCollection.CountDocuments(context.Background(), filter)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
		var result database.ExternalAPIToken
		err = externalTokenCollection.FindOne(context.Background(), filter).Decode(&result)
		assert.NoError(t, err)
		assert.Equal(t, external.TASK_SERVICE_ID_LINEAR, result.ServiceID)
		assert.Equal(t, linearID, result.ID)
		assert.Equal(t, "{}", result.Token)
		assert.True(t, result.IsBadToken)

		filter = bson.M{"account_id": "test_migrate_11", "service_id": "slack"}
		count, err = externalTokenCollection.CountDocuments(context.Background(), filter)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
		err = externalTokenCollection.FindOne(context.Background(), filter).Decode(&result)
		assert.NoError(t, err)
		assert.Equal(t, external.TASK_SERVICE_ID_SLACK, result.ServiceID)
		assert.Equal(t, "{ slack-token-string }", result.Token)
	})
	t.Run("MigrateDown", func(t *testing.T) {
		err = migrate.Steps(-1)
		assert.NoError(t, err)
	})
}
