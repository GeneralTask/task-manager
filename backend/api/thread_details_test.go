package api

import (
	"fmt"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestThreadDetail(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	testEmail := fmt.Sprintf("%s@generaltask.com", uuid.New().String()[:4])
	authToken := login(testEmail, "General Tasker")
	userID := getUserIDFromAuthToken(t, db, authToken)
	notUserID := primitive.NewObjectID()

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
	nonUserThreadIDHex := insertTestItem(t, notUserID, database.Item{
		TaskBase: database.TaskBase{
			UserID:     notUserID,
			IDExternal: "sample_gmail_thread_id_2",
			SourceID:   external.TASK_SOURCE_ID_GMAIL,
		},
		EmailThread: database.EmailThread{
			ThreadID:      "sample_gmail_thread_id_2",
			LastUpdatedAt: 0,
		},
		TaskType: database.TaskType{IsThread: true},
	})
	router := GetRouter(GetAPI())

	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/threads/detail/%s/", threadIDHex),
			nil)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
	t.Run("InvalidTaskID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/threads/detail/%s/", primitive.NewObjectID().Hex()),
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
			fmt.Sprintf("/threads/detail/%s/", nonUserThreadIDHex),
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
			fmt.Sprintf("/threads/detail/%s/", threadIDHex),
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t,
			fmt.Sprintf("{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"is_archived\":false,\"source\":{\"account_id\":\"\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"message_id\":\"000000000000000000000000\",\"subject\":\"test subject 1\",\"body\":\"test body 1\",\"sent_at\":\"2019-04-20T00:00:00Z\",\"is_unread\":true,\"sender\":{\"name\":\"test\",\"email\":\"test@generaltask.com\",\"reply_to\":\"test-reply@generaltask.com\"},\"recipients\":{\"to\":[{\"name\":\"p1\",\"email\":\"p1@gmail.com\"}],\"cc\":[{\"name\":\"p2\",\"email\":\"p2@gmail.com\"}],\"bcc\":[{\"name\":\"p3\",\"email\":\"p3@gmail.com\"}]},\"num_attachments\":0},{\"message_id\":\"000000000000000000000000\",\"subject\":\"test subject 2\",\"body\":\"test body 2\",\"sent_at\":\"2018-04-20T00:00:00Z\",\"is_unread\":false,\"sender\":{\"name\":\"test\",\"email\":\"test@generaltask.com\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]},\"num_attachments\":0}]}", threadIDHex),
			string(body))
	})
}
