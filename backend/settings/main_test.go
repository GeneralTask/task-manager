package settings

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
)

func TestGetSettingsOptions(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID := primitive.NewObjectID()
	viewCollection := database.GetViewCollection(db)
	view := database.View{
		UserID: userID,
		Type:   string(constants.ViewGithub),
	}
	res, err := viewCollection.InsertOne(parentCtx, view)
	assert.NoError(t, err)
	insertedViewID := res.InsertedID.(primitive.ObjectID).Hex()
	_, err = viewCollection.InsertOne(parentCtx, database.View{
		UserID: primitive.NewObjectID(),
		Type:   string(constants.ViewGithub),
	})
	assert.NoError(t, err)
	_, err = viewCollection.InsertOne(parentCtx, database.View{
		UserID: userID,
		Type:   string(constants.ViewLinear),
	})
	assert.NoError(t, err)

	t.Run("Success", func(t *testing.T) {
		settings, err := GetSettingsOptions(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 6, len(*settings))
		assert.Equal(t, insertedViewID+"_github_filtering_preference", (*settings)[3].FieldKey)
		assert.Equal(t, insertedViewID+"_github_sorting_preference", (*settings)[4].FieldKey)
		assert.Equal(t, insertedViewID+"_github_sorting_direction", (*settings)[5].FieldKey)
	})
}
