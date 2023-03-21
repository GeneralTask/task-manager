package api

import (
	"context"
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestLogout(t *testing.T) {
	UnauthorizedTest(t, "POST", "/logout/", nil)
	t.Run("Logout", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		tokenCollection := database.GetInternalTokenCollection(db)

		count, _ := tokenCollection.CountDocuments(context.Background(), bson.M{"token": authToken})
		assert.Equal(t, int64(1), count)

		ServeRequest(t, authToken, "POST", "/logout/", nil, http.StatusOK, nil)

		count, _ = tokenCollection.CountDocuments(context.Background(), bson.M{"token": authToken})
		assert.Equal(t, int64(0), count)
	})
}
