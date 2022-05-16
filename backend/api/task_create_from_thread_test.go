package api

import (
	"bytes"
	"context"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/testutils"
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
		},
		EmailThread: database.EmailThread{
			ThreadID:      "sample_gmail_thread_id",
			LastUpdatedAt: 0,
			Emails: []database.Email{
				{
					MessageID:    firstEmailID,
					SMTPID:       "sample_smtp_1",
					EmailID:      "sample_gmail_thread_id",
					Subject:      "test subject 1",
					Body:         "test body 1",
					SenderDomain: "gmail",
					SenderEmail:  "test@generaltask.com",
					SenderName:   "test",
					ReplyTo:      "test-reply@generaltask.com",
					IsUnread:     true,
					Recipients: database.Recipients{
						To:  []database.Recipient{{Name: "p1", Email: "p1@gmail.com"}},
						Cc:  []database.Recipient{{Name: "p2", Email: "p2@gmail.com"}},
						Bcc: []database.Recipient{{Name: "p3", Email: "p3@gmail.com"}},
					},
					SentAt: *testutils.CreateDateTime("2019-04-20"),
				},
				{
					SMTPID:       "sample_smtp_1",
					EmailID:      "sample_gmail_thread_id",
					Subject:      "test subject 2",
					Body:         "test body 2",
					SenderDomain: "gmail",
					SenderEmail:  "test@generaltask.com",
					SenderName:   "test",
					SentAt:       *testutils.CreateDateTime("2018-04-20"),
				},
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
			}`)), http.StatusBadRequest)
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
