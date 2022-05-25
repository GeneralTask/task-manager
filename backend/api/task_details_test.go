package api

import (
	"bytes"
	"context"
	"fmt"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"go.mongodb.org/mongo-driver/bson"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestTaskDetail(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	dbCtx, cancel := context.WithTimeout(context.Background(), constants.DatabaseTimeout)
	defer cancel()

	testEmail := createRandomGTEmail()
	authToken := login(testEmail, "General Tasker")
	userID := getUserIDFromAuthToken(t, db, authToken)
	notUserID := primitive.NewObjectID()

	jiraTaskIDHex := insertTestTask(t, userID, database.Item{
		TaskBase: database.TaskBase{
			UserID:      userID,
			IDExternal:  "sample_jira_id_details",
			SourceID:    external.TASK_SOURCE_ID_JIRA,
			IsCompleted: true,
		},
		TaskType: database.TaskType{IsTask: true},
	})
	nonUserTaskIDHex := insertTestTask(t, userID, database.Item{
		TaskBase: database.TaskBase{
			UserID:     notUserID,
			IDExternal: "sample_jira_id_details_2",
			SourceID:   external.TASK_SOURCE_ID_JIRA,
		},
		TaskType: database.TaskType{IsTask: true},
	})

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
					IsUnread:     true,
					SentAt:       *testutils.CreateDateTime("2018-04-20"),
				},
			},
		},
		TaskType: database.TaskType{IsThread: true},
	})
	threadID, _ := primitive.ObjectIDFromHex(threadIDHex)

	router := GetRouter(GetAPI())

	UnauthorizedTest(t, "GET", fmt.Sprintf("/tasks/detail/%s/", jiraTaskIDHex), nil)
	t.Run("InvalidTaskID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/tasks/detail/%s/", primitive.NewObjectID().Hex()),
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("TaskDoesNotBelongToUser", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/tasks/detail/%s/", nonUserTaskIDHex),
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/tasks/detail/%s/", jiraTaskIDHex),
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)

		assert.Equal(t,
			fmt.Sprintf(`{"id":"%s","id_ordering":0,"source":{"name":"Jira","logo":"/images/jira.svg","logo_v2":"jira","is_completable":true,"is_replyable":false},"deeplink":"","title":"","body":"","sender":"","due_date":"","time_allocated":0,"sent_at":"1970-01-01T00:00:00Z","is_done":true}`, jiraTaskIDHex),
			string(body))
	})
	t.Run("SuccessTaskFromEmail", func(t *testing.T) {
		ServeRequest(t, authToken, "POST", "/create_task_from_thread/"+threadIDHex+"/",
			bytes.NewBuffer([]byte(`{
				"title": "sample title",
				"body": "sample body",
				"email_id": "`+firstEmailID.Hex()+`"
			}`)), http.StatusOK)
		var task database.Item
		err = database.GetTaskCollection(db).FindOne(dbCtx, bson.M{"title": "sample title", "user_id": userID}).Decode(&task)
		assert.True(t, task.IsTask)
		assert.Equal(t, threadID, *task.LinkedMessage.ThreadID)
		assert.Equal(t, firstEmailID, *task.LinkedMessage.EmailID)

		body := ServeRequest(t, authToken, "GET", fmt.Sprintf("/tasks/detail/%s/", task.ID.Hex()),
			nil, http.StatusOK)
		assert.Equal(t,
			fmt.Sprintf(`{"id":"%s","id_ordering":0,"source":{"name":"General Task","logo":"/images/generaltask.svg","logo_v2":"generaltask","is_completable":true,"is_replyable":false},"deeplink":"","title":"sample title","body":"sample body","sender":"","due_date":"","time_allocated":0,"sent_at":"1970-01-01T00:00:00Z","is_done":false,"linked_email_thread":{"linked_thread_id":"%s","linked_email_id":"%s","email_thread":{"id":"%s","deeplink":"","is_task":false,"source":{"account_id":"","name":"Gmail","logo":"/images/gmail.svg","logo_v2":"gmail","is_replyable":true},"emails":[{"message_id":"%s","subject":"test subject 1","body":"test body 1","sent_at":"2019-04-20T00:00:00Z","is_unread":true,"sender":{"name":"test","email":"test@generaltask.com","reply_to":"test-reply@generaltask.com"},"recipients":{"to":[{"name":"p1","email":"p1@gmail.com"}],"cc":[{"name":"p2","email":"p2@gmail.com"}],"bcc":[{"name":"p3","email":"p3@gmail.com"}]}},{"message_id":"000000000000000000000000","subject":"test subject 2","body":"test body 2","sent_at":"2018-04-20T00:00:00Z","is_unread":true,"sender":{"name":"test","email":"test@generaltask.com","reply_to":""},"recipients":{"to":[],"cc":[],"bcc":[]}}]}}}`,
				task.ID.Hex(), threadID.Hex(), firstEmailID.Hex(), threadID.Hex(), firstEmailID.Hex()),
			string(body))
	})
}

func insertTestTask(t *testing.T, userID primitive.ObjectID, task database.Item) string {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	insertResult, err := taskCollection.InsertOne(context.Background(), task)
	assert.NoError(t, err)
	taskID := insertResult.InsertedID.(primitive.ObjectID)
	taskIDHex := taskID.Hex()
	return taskIDHex
}
