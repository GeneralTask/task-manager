package api

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
)

func TestEventModify(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.com", "")
	// userID := getUserIDFromAuthToken(t, db, authToken)

	taskCollection := database.GetTaskCollection(db)
	taskCollection.InsertOne(parentCtx, database.Item{})

	// dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)

	eventID := "duck"
	validUrl := fmt.Sprintf("/events/modify/%s/", eventID)

	t.Run("Unauthorized", func(t *testing.T) {
		ServeRequest(t, "badAuthToken", "PATCH", validUrl, nil, http.StatusUnauthorized)
	})
	t.Run("NoBody", func(t *testing.T) {
		ServeRequest(t, authToken, "PATCH", validUrl, nil, http.StatusBadRequest)
	})
	t.Run("EmptyBody", func(t *testing.T) {
		body := bytes.NewBuffer([]byte(`{}`))
		ServeRequest(t, authToken, "PATCH", validUrl, body, http.StatusBadRequest)
	})
	t.Run("ModifyTitle", func(t *testing.T) {
		body := bytes.NewBuffer([]byte(`{"title": "duck party"}`))
		ServeRequest(t, authToken, "PATCH", validUrl, body, http.StatusOK)
		// TODO: get gud
	})

}
