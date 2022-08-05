package api

import (
	"bytes"
	"context"
	"fmt"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
)

// see gcal_test.go for success tests
func TestInvalidEventModify(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	taskCollection := database.GetTaskCollection(db)
	event, err := taskCollection.InsertOne(parentCtx, database.Item{
		TaskBase: database.TaskBase{
			UserID:     userID,
			SourceID:   "gcal",
			IDExternal: primitive.NewObjectID().Hex(),
		},
	})
	assert.NoError(t, err)
	eventID := event.InsertedID.(primitive.ObjectID).Hex()
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
	t.Run("MissingModifyParams", func(t *testing.T) {
		body := bytes.NewBuffer([]byte(`{"account_id": "duck@duck.com"}`))
		ServeRequest(t, authToken, "PATCH", validUrl, body, http.StatusBadRequest)
	})
	t.Run("InvalidEventID", func(t *testing.T) {
		body := bytes.NewBuffer([]byte(`{"account_id": "duck@duck.com", "summary": "duck"}`))
		ServeRequest(t, authToken, "PATCH", "/events/modify/bad_id/", body, http.StatusBadRequest)
	})
	t.Run("EventIDFromOtherUser", func(t *testing.T) {
		otherUserID := primitive.NewObjectID()
		event, err := taskCollection.InsertOne(parentCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID: otherUserID,
			},
		})
		assert.NoError(t, err)
		eventID := event.InsertedID.(primitive.ObjectID)

		body := bytes.NewBuffer([]byte(`{"account_id": "duck@duck.com", "summary": "duck"}`))
		ServeRequest(t, authToken, "PATCH", "/events/modify/"+eventID.Hex()+"/", body, http.StatusNotFound)
	})
}
