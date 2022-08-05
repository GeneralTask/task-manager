package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestLogout(t *testing.T) {
	parentCtx := context.Background()

	UnauthorizedTest(t, "POST", "/logout/", nil)
	t.Run("Logout", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		tokenCollection := database.GetInternalTokenCollection(db)

		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		count, _ := tokenCollection.CountDocuments(dbCtx, bson.M{"token": authToken})
		assert.Equal(t, int64(1), count)

		router := GetRouter(GetAPI())

		request, _ := http.NewRequest("POST", "/logout/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		count, _ = tokenCollection.CountDocuments(dbCtx, bson.M{"token": authToken})
		assert.Equal(t, int64(0), count)
	})
}
