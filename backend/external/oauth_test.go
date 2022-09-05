package external

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestGetExternalOauth2Client(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID := primitive.NewObjectID()
	accountID := "accountID"
	serviceID := "example service"

	t.Run("NoDocument", func(t *testing.T) {
		client := getExternalOauth2Client(db, userID, accountID, serviceID, nil)
		assert.Nil(t, client)
	})
	t.Run("Invalid token", func(t *testing.T) {
		ctx := context.Background()
		invalidUser := primitive.NewObjectID()
		_, err := database.GetExternalTokenCollection(db).InsertOne(ctx, database.ExternalAPIToken{
			UserID:    invalidUser,
			ServiceID: serviceID,
			AccountID: accountID,
		})
		assert.NoError(t, err)
		client := getExternalOauth2Client(db, invalidUser, accountID, serviceID, &OauthConfig{})
		assert.Nil(t, client)
	})
	t.Run("Success", func(t *testing.T) {
		ctx := context.Background()
		_, err := database.GetExternalTokenCollection(db).InsertOne(ctx, database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: serviceID,
			AccountID: accountID,
			Token:     `{"access_token":"example"}`,
		})
		assert.NoError(t, err)

		client := getExternalOauth2Client(db, userID, accountID, serviceID, &OauthConfig{})
		assert.NotNil(t, client)
	})
}
