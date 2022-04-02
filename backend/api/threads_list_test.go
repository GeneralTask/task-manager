package api

import (
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

	testEmail := fmt.Sprintf("%s@generaltask.com", uuid.New().String()[:4])
	authToken := login(testEmail, "General Tasker")
	userID := getUserIDFromAuthToken(t, db, authToken)
	notUserID := primitive.NewObjectID()

	threadIDHex1 := insertTestItem(t, userID, database.Item{
		TaskBase: database.TaskBase{
			UserID:     userID,
			IDExternal: "sample_gmail_thread_id",
			SourceID:   external.TASK_SOURCE_ID_GMAIL,
		},
		EmailThread: database.EmailThread{
			ThreadID:      "sample_gmail_thread_id",
			LastUpdatedAt: 0,
			Emails: []database.Email{
				{EmailID: "sample_email_1", SentAt: createTimestamp("2018-04-20")},
				{EmailID: "sample_email_2", SentAt: createTimestamp("2019-04-20")},
			},
		},
		TaskType: database.TaskType{IsThread: true},
	})
	threadIDHex2 := insertTestItem(t, userID, database.Item{
		TaskBase: database.TaskBase{
			UserID:     userID,
			IDExternal: "sample_gmail_thread_id2",
			SourceID:   external.TASK_SOURCE_ID_GMAIL,
		},
		EmailThread: database.EmailThread{
			ThreadID:      "sample_gmail_thread_id2",
			LastUpdatedAt: 0,
			Emails: []database.Email{
				{EmailID: "sample_email_2.1", SentAt: createTimestamp("2017-04-20")},
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

	//fmt.Sprintf("{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"source\":{\"account_id\":\"\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"smtp_id\":\"sample_smtp_1\",\"subject\":\"test subject 1\",\"body\":\"test body 1\",\"sent_at\":\"2019-04-20T00:00:00Z\",\"is_unread\":true,\"sender\":{\"name\":\"test\",\"email\":\"test@generaltask.com\",\"reply_to\":\"test-reply@generaltask.com\"},\"recipients\":{\"to\":[{\"name\":\"p1\",\"email\":\"p1@gmail.com\"}],\"cc\":[{\"name\":\"p2\",\"email\":\"p2@gmail.com\"}],\"bcc\":[{\"name\":\"p3\",\"email\":\"p3@gmail.com\"}]}},{\"smtp_id\":\"sample_smtp_1\",\"subject\":\"test subject 2\",\"body\":\"test body 2\",\"sent_at\":\"2018-04-20T00:00:00Z\",\"is_unread\":false,\"sender\":{\"name\":\"test\",\"email\":\"test@generaltask.com\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]}", threadIDHex),
	t.Run("InvalidTaskID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			"/threads/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	//t.Run("TaskDoesNotBelongToUser", func(t *testing.T) {
	//	request, _ := http.NewRequest(
	//		"GET",
	//		fmt.Sprintf("/threads/detail/%s/", nonUserThreadIDHex),
	//		nil)
	//	request.Header.Add("Authorization", "Bearer "+authToken)
	//	recorder := httptest.NewRecorder()
	//	router.ServeHTTP(recorder, request)
	//	assert.Equal(t, http.StatusNotFound, recorder.Code)
	//	body, err := ioutil.ReadAll(recorder.Body)
	//	assert.NoError(t, err)
	//	assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	//})
	//t.Run("Success", func(t *testing.T) {
	//	request, _ := http.NewRequest(
	//		"GET",
	//		fmt.Sprintf("/threads/detail/%s/", threadIDHex),
	//		nil)
	//	request.Header.Add("Authorization", "Bearer "+authToken)
	//	recorder := httptest.NewRecorder()
	//	router.ServeHTTP(recorder, request)
	//	assert.Equal(t, http.StatusOK, recorder.Code)
	//	body, err := ioutil.ReadAll(recorder.Body)
	//	assert.NoError(t, err)
	//	assert.Equal(t,
	//		fmt.Sprintf("{\"id\":\"%s\",\"deeplink\":\"\",\"is_task\":false,\"source\":{\"account_id\":\"\",\"name\":\"Gmail\",\"logo\":\"/images/gmail.svg\",\"logo_v2\":\"gmail\",\"is_replyable\":true},\"emails\":[{\"smtp_id\":\"sample_smtp_1\",\"subject\":\"test subject 1\",\"body\":\"test body 1\",\"sent_at\":\"2019-04-20T00:00:00Z\",\"is_unread\":true,\"sender\":{\"name\":\"test\",\"email\":\"test@generaltask.com\",\"reply_to\":\"test-reply@generaltask.com\"},\"recipients\":{\"to\":[{\"name\":\"p1\",\"email\":\"p1@gmail.com\"}],\"cc\":[{\"name\":\"p2\",\"email\":\"p2@gmail.com\"}],\"bcc\":[{\"name\":\"p3\",\"email\":\"p3@gmail.com\"}]}},{\"smtp_id\":\"sample_smtp_1\",\"subject\":\"test subject 2\",\"body\":\"test body 2\",\"sent_at\":\"2018-04-20T00:00:00Z\",\"is_unread\":false,\"sender\":{\"name\":\"test\",\"email\":\"test@generaltask.com\",\"reply_to\":\"\"},\"recipients\":{\"to\":[],\"cc\":[],\"bcc\":[]}}]}", threadIDHex),
	//		string(body))
	//})
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
