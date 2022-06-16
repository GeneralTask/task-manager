package api

import (
	"bytes"
	"context"
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

func TestThreadList(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	testEmail := fmt.Sprintf("%s@generaltask.com", uuid.New().String())
	authToken := login(testEmail, "General Tasker")
	userID := getUserIDFromAuthToken(t, db, authToken)
	notUserID := primitive.NewObjectID()

	threadIDHex1 := insertTestItem(t, userID, database.Item{
		TaskBase: database.TaskBase{
			UserID:          userID,
			IDExternal:      "sample_gmail_thread_id",
			SourceID:        external.TASK_SOURCE_ID_GMAIL,
			SourceAccountID: testEmail,
		},
		EmailThread: database.EmailThread{
			ThreadID:      "sample_gmail_thread_id",
			LastUpdatedAt: *testutils.CreateDateTime("2020-04-20"),
			Emails: []database.Email{
				{EmailID: "sample_email_1_1", SentAt: *testutils.CreateDateTime("2018-04-20"), IsUnread: false},
				{EmailID: "sample_email_1_2", SentAt: *testutils.CreateDateTime("2020-04-20"), IsUnread: false},
			},
		},
		TaskType: database.TaskType{IsThread: true},
	})
	threadIDHex2 := insertTestItem(t, userID, database.Item{
		TaskBase: database.TaskBase{
			UserID:          userID,
			IDExternal:      "sample_gmail_thread_id2",
			SourceID:        external.TASK_SOURCE_ID_GMAIL,
			SourceAccountID: "prefix_" + testEmail,
		},
		EmailThread: database.EmailThread{
			ThreadID:      "sample_gmail_thread_id2",
			LastUpdatedAt: *testutils.CreateDateTime("2019-04-20"),
			Emails: []database.Email{
				{EmailID: "sample_email_2", SentAt: *testutils.CreateDateTime("2019-04-20"), IsUnread: true},
			},
		},
		TaskType: database.TaskType{IsThread: true},
	})
	threadIDHex3 := insertTestItem(t, userID, database.Item{
		TaskBase: database.TaskBase{
			UserID:          userID,
			IDExternal:      "sample_gmail_thread_id3",
			SourceID:        external.TASK_SOURCE_ID_GMAIL,
			SourceAccountID: testEmail,
		},
		EmailThread: database.EmailThread{
			ThreadID:      "sample_gmail_thread_id3",
			LastUpdatedAt: *testutils.CreateDateTime("2021-04-20"),
			Emails: []database.Email{
				{EmailID: "sample_email_3", SentAt: *testutils.CreateDateTime("2021-04-20"), IsUnread: false},
			},
		},
		TaskType: database.TaskType{IsThread: true},
	})
	threadIDHex4 := insertTestItem(t, userID, database.Item{
		TaskBase: database.TaskBase{
			UserID:          userID,
			IDExternal:      "sample_gmail_thread_id4",
			SourceID:        external.TASK_SOURCE_ID_GMAIL,
			SourceAccountID: testEmail,
		},
		EmailThread: database.EmailThread{
			ThreadID:      "sample_gmail_thread_id4",
			LastUpdatedAt: *testutils.CreateDateTime("2022-04-20"),
			Emails: []database.Email{
				{EmailID: "sample_email_4", SentAt: *testutils.CreateDateTime("2022-04-20"), IsUnread: true},
			},
			IsArchived: true,
		},
		TaskType: database.TaskType{IsThread: true},
	})
	_ = insertTestItem(t, notUserID, database.Item{
		TaskBase: database.TaskBase{
			UserID:     notUserID,
			IDExternal: "sample_gmail_thread_id_non_user",
			SourceID:   external.TASK_SOURCE_ID_GMAIL,
		},
		EmailThread: database.EmailThread{
			ThreadID:      "sample_gmail_thread_id_non_user",
			LastUpdatedAt: 0,
		},
		TaskType: database.TaskType{IsThread: true},
	})
	router := GetRouter(GetAPI())

	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"GET",
			"/threads/",
			nil)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
	t.Run("SuccessAll", func(t *testing.T) {
		params := []byte(`{}`)
		request, _ := http.NewRequest(
			"GET",
			"/threads/",
			bytes.NewBuffer(params))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t,
			fmt.Sprintf("[{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"is_archived\":false,\"source\":{\"account_id\":\"%s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"message_id\":\"000000000000000000000000\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2021-04-20T00:00:00Z\",\"is_unread\":false,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]},\"num_attachments\":0}]},{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"is_archived\":false,\"source\":{\"account_id\":\"%s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"message_id\":\"000000000000000000000000\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2018-04-20T00:00:00Z\",\"is_unread\":false,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]},\"num_attachments\":0},{\"message_id\":\"000000000000000000000000\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2020-04-20T00:00:00Z\",\"is_unread\":false,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]},\"num_attachments\":0}]},{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"is_archived\":false,\"source\":{\"account_id\":\"prefix_%s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"message_id\":\"000000000000000000000000\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2019-04-20T00:00:00Z\",\"is_unread\":true,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]},\"num_attachments\":0}]}]",
				threadIDHex3, testEmail, threadIDHex1, testEmail, threadIDHex2, testEmail),
			string(body))
	})
	t.Run("SuccessPaged", func(t *testing.T) {
		params := []byte(`{}`)
		request, _ := http.NewRequest(
			"GET",
			"/threads/?page=2&limit=1",
			bytes.NewBuffer(params))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t,
			fmt.Sprintf("[{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"is_archived\":false,\"source\":{\"account_id\":\"%s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"message_id\":\"000000000000000000000000\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2018-04-20T00:00:00Z\",\"is_unread\":false,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}},{\"message_id\":\"000000000000000000000000\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2020-04-20T00:00:00Z\",\"is_unread\":false,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]}]",
				threadIDHex1, testEmail),
			string(body))
	})
	t.Run("SuccessOnlyUnread", func(t *testing.T) {
		params := []byte(`{}`)
		request, _ := http.NewRequest(
			"GET",
			"/threads/?only_unread=true",
			bytes.NewBuffer(params))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t,
			fmt.Sprintf("[{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"is_archived\":false,\"source\":{\"account_id\":\"prefix_%s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"message_id\":\"000000000000000000000000\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2019-04-20T00:00:00Z\",\"is_unread\":true,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]}]",
				threadIDHex2, testEmail),
			string(body))
	})
	t.Run("SuccessSingleAccount", func(t *testing.T) {
		params := []byte(`{}`)
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/threads/?source_id=gmail&source_account_id=prefix_%s", testEmail),
			bytes.NewBuffer(params))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t,
			fmt.Sprintf("[{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"is_archived\":false,\"source\":{\"account_id\":\"prefix_%s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"message_id\":\"000000000000000000000000\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2019-04-20T00:00:00Z\",\"is_unread\":true,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]}]",
				threadIDHex2, testEmail),
			string(body))
	})
	t.Run("GetArchivedEmails", func(t *testing.T) {
		params := []byte(`{}`)
		request, _ := http.NewRequest(
			"GET",
			"/threads/?is_archived=true",
			bytes.NewBuffer(params))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t,
			fmt.Sprintf("[{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"is_archived\":true,\"source\":{\"account_id\":\"%s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"message_id\":\"000000000000000000000000\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2022-04-20T00:00:00Z\",\"is_unread\":true,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]}]",
				threadIDHex4, testEmail),
			string(body))
	})
	t.Run("GetUnArchivedEmails", func(t *testing.T) {
		params := []byte(`{}`)
		request, _ := http.NewRequest(
			"GET",
			"/threads/?is_archived=false",
			bytes.NewBuffer(params))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t,
			fmt.Sprintf("[{\"id\":\"%[1]s\",\"deeplink\":\"\",\"is_task\":false,\"is_archived\":false,\"source\":{\"account_id\":\"%[4]s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"message_id\":\"000000000000000000000000\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2021-04-20T00:00:00Z\",\"is_unread\":false,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]},{\"id\":\"%[2]s\",\"deeplink\":\"\",\"is_task\":false,\"is_archived\":false,\"source\":{\"account_id\":\"%[4]s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"message_id\":\"000000000000000000000000\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2018-04-20T00:00:00Z\",\"is_unread\":false,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}},{\"message_id\":\"000000000000000000000000\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2020-04-20T00:00:00Z\",\"is_unread\":false,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]},{\"id\":\"%[3]s\",\"deeplink\":\"\",\"is_task\":false,\"is_archived\":false,\"source\":{\"account_id\":\"prefix_%[4]s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"message_id\":\"000000000000000000000000\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2019-04-20T00:00:00Z\",\"is_unread\":true,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]}]",
				threadIDHex3, threadIDHex1, threadIDHex2, testEmail),
			string(body))
	})
}

func insertTestItem(t *testing.T, userID primitive.ObjectID, task database.Item) string {
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
