package api

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
			LastUpdatedAt: createTimestamp("2020-04-20"),
			Emails: []database.Email{
				{EmailID: "sample_email_1_1", SentAt: createTimestamp("2018-04-20"), IsUnread: false},
				{EmailID: "sample_email_1_2", SentAt: createTimestamp("2020-04-20"), IsUnread: false},
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
			LastUpdatedAt: createTimestamp("2019-04-20"),
			Emails: []database.Email{
				{EmailID: "sample_email_2", SentAt: createTimestamp("2019-04-20"), IsUnread: true},
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
			LastUpdatedAt: createTimestamp("2021-04-20"),
			Emails: []database.Email{
				{EmailID: "sample_email_3", SentAt: createTimestamp("2021-04-20"), IsUnread: false},
			},
		},
		TaskType: database.TaskType{IsThread: true},
	})
	nonUserThreadIDHex := insertTestItem(t, notUserID, database.Item{
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

	_ = nonUserThreadIDHex
	_ = threadIDHex3
	_ = threadIDHex2
	_ = threadIDHex1

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
			fmt.Sprintf("[{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"source\":{\"account_id\":\"%s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"smtp_id\":\"\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2021-04-19T19:00:00-05:00\",\"is_unread\":false,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]},{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"source\":{\"account_id\":\"%s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"smtp_id\":\"\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2018-04-19T19:00:00-05:00\",\"is_unread\":false,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}},{\"smtp_id\":\"\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2020-04-19T19:00:00-05:00\",\"is_unread\":false,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]},{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"source\":{\"account_id\":\"prefix_%s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"smtp_id\":\"\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2019-04-19T19:00:00-05:00\",\"is_unread\":true,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]}]",
				threadIDHex3, testEmail, threadIDHex1, testEmail, threadIDHex2, testEmail),
			string(body))
	})
	t.Run("SuccessPaged", func(t *testing.T) {
		params := []byte(`{
			"page": 2,
			"limit": 1
		}`)
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
			fmt.Sprintf("[{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"source\":{\"account_id\":\"%s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"smtp_id\":\"\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2018-04-19T19:00:00-05:00\",\"is_unread\":false,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}},{\"smtp_id\":\"\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2020-04-19T19:00:00-05:00\",\"is_unread\":false,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]}]",
				threadIDHex1, testEmail),
			string(body))
	})
	t.Run("SuccessOnlyUnread", func(t *testing.T) {
		params := []byte(`{
			"only_unread": true
		}`)
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
			fmt.Sprintf("[{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"source\":{\"account_id\":\"prefix_%s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"smtp_id\":\"\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2019-04-19T19:00:00-05:00\",\"is_unread\":true,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]}]",
				threadIDHex2, testEmail),
			string(body))
	})
	t.Run("SuccessSingleAccount", func(t *testing.T) {
		params := []byte(fmt.Sprintf(`{
			"account": {
				 "source_id": "gmail",
				 "source_account_id": "prefix_%s"
			}			
		}`, testEmail))
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
			fmt.Sprintf("[{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"source\":{\"account_id\":\"prefix_%s\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"smtp_id\":\"\",\"subject\":\"\",\"body\":\"\",\"sent_at\":\"2019-04-19T19:00:00-05:00\",\"is_unread\":true,\"sender\":{\"name\":\"\",\"email\":\"\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]}]",
				threadIDHex2, testEmail),
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

func createTimestamp(dt string) primitive.DateTime {
	createdAt, _ := time.Parse("2006-01-02", dt)
	return primitive.NewDateTimeFromTime(createdAt)
}
