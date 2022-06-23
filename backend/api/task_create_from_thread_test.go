package api

import (
	"bytes"
	"context"
	"github.com/GeneralTask/task-manager/backend/constants"
	"go.mongodb.org/mongo-driver/bson"
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestCreateTaskFromThread(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	testEmail := createRandomGTEmail()
	authToken := login(testEmail, "General Tasker")
	userID := getUserIDFromAuthToken(t, db, authToken)

	taskCollection := database.GetTaskCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	firstEmailID := primitive.NewObjectID()
	threadIDHex := insertTestItem(t, userID, database.Item{
		TaskBase: database.TaskBase{
			UserID:     userID,
			IDExternal: "sample_gmail_thread_id",
			SourceID:   external.TASK_SOURCE_ID_GMAIL,
			Deeplink:   "deeplink.com/wut",
		},
		EmailThread: database.EmailThread{
			Emails: []database.Email{
				{MessageID: firstEmailID},
				{MessageID: primitive.NewObjectID()},
			},
		},
		TaskType: database.TaskType{IsThread: true},
	})
	threadID, _ := primitive.ObjectIDFromHex(threadIDHex)

	var message database.Item
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = taskCollection.FindOne(dbCtx, bson.M{"_id": threadID}).Decode(&message)
	assert.False(t, message.IsTask)
	assert.True(t, message.IsThread)

	UnauthorizedTest(t, "POST", "/create_task_from_thread/"+threadIDHex+"/", nil)
	t.Run("MissingTitle", func(t *testing.T) {
		ServeRequest(t, authToken, "POST", "/create_task_from_thread/"+threadIDHex+"/",
			bytes.NewBuffer([]byte(`{
				"body": "sample body"
			}`)), http.StatusBadRequest)
	})
	t.Run("MissingBody", func(t *testing.T) {
		ServeRequest(t, authToken, "POST", "/create_task_from_thread/"+threadIDHex+"/",
			bytes.NewBuffer([]byte(`{
				"title": "sample title"
			}`)), http.StatusOK)
	})
	t.Run("SuccessCreateTaskFromThread", func(t *testing.T) {
		ServeRequest(t, authToken, "POST", "/create_task_from_thread/"+threadIDHex+"/",
			bytes.NewBuffer([]byte(`{
				"title": "sample title",
				"body": "sample body"
			}`)), http.StatusOK)
		var task database.Item
		err = taskCollection.FindOne(dbCtx, bson.M{"title": "sample title", "user_id": userID}).Decode(&task)
		assert.True(t, task.IsTask)
		assert.Equal(t, threadID, *task.LinkedMessage.ThreadID)
		assert.Equal(t, "deeplink.com/wut", task.Deeplink)
		assert.Nil(t, task.LinkedMessage.EmailID)
	})
	t.Run("SuccessCreateTaskFromEmail", func(t *testing.T) {
		ServeRequest(t, authToken, "POST", "/create_task_from_thread/"+threadIDHex+"/",
			bytes.NewBuffer([]byte(`{
				"title": "sample title 2",
				"body": "sample body 2",
				"email_id": "`+firstEmailID.Hex()+`"
			}`)), http.StatusOK)
		var task database.Item
		err = taskCollection.FindOne(dbCtx, bson.M{"title": "sample title 2", "user_id": userID}).Decode(&task)
		assert.True(t, task.IsTask)
		assert.Equal(t, threadID, *task.LinkedMessage.ThreadID)
		assert.Equal(t, firstEmailID, *task.LinkedMessage.EmailID)
	})
}
