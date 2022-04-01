package api

import (
	"bytes"
	"context"
	"fmt"
	"time"

	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/settings"
	"github.com/google/uuid"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestChangeThreadReadStatus(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

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
					SentAt: createTimestamp("2019-04-20"),
				},
				{
					SMTPID:       "sample_smtp_1",
					EmailID:      "sample_gmail_thread_id",
					Subject:      "test subject 2",
					Body:         "test body 2",
					SenderDomain: "gmail",
					SenderEmail:  "test@generaltask.com",
					SenderName:   "test",
					SentAt:       createTimestamp("2018-04-20"),
				},
			},
		},
		TaskType: database.TaskType{IsThread: true},
	})
	threadID, _ := primitive.ObjectIDFromHex(threadIDHex)

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
	_ = nonUserThreadIDHex

	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"PATCH",
			"/threads/modify/"+threadIDHex+"/", nil)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})

	t.Run("InvalidUser", func(t *testing.T) {
		router := GetRouter(GetAPI())

		secondAuthToken := login("tester@generaltask.com", "")
		request, _ := http.NewRequest(
			"PATCH",
			"/threads/modify/"+threadIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_unread": true}`)))
		request.Header.Add("Authorization", "Bearer "+secondAuthToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})

	t.Run("InvalidHex", func(t *testing.T) {
		api := GetAPI()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/threads/modify/"+threadIDHex+"random_suffix/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})

	t.Run("MissingParams", func(t *testing.T) {
		router := GetRouter(GetAPI())
		err := settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)
		assert.NoError(t, err)
		request, _ := http.NewRequest(
			"PATCH",
			"/threads/modify/"+threadIDHex+"/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})

	t.Run("GmailSuccessRead", func(t *testing.T) {
		settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyMarkAsRead)
		unreadGmailModifyServer := getGmailChangeLabelServer(t, "UNREAD", false)

		api := GetAPI()
		api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &unreadGmailModifyServer.URL
		unreadRouter := GetRouter(api)

		var threadItem database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": threadID}).Decode(&threadItem)
		// assert.True(t, threadItem.IsUnread)  // we don't set this for ThreadItems
		assert.True(t, threadItem.IsThread)

		request, _ := http.NewRequest(
			"PATCH",
			"/threads/modify/"+threadIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_unread": false}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		unreadRouter.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": threadID}).Decode(&threadItem)
		assert.False(t, threadItem.IsUnread)
		assert.True(t, threadItem.IsThread)
	})

	// t.Run("GmailSuccessUnread", func(t *testing.T) {
	// 	settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyMarkAsRead)
	// 	unreadGmailModifyServer := getGmailChangeLabelServer(t, "UNREAD", true)

	// 	api := GetAPI()
	// 	api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &unreadGmailModifyServer.URL
	// 	unreadRouter := GetRouter(api)

	// 	var message database.Item
	// 	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	// 	defer cancel()
	// 	err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
	// 	assert.False(t, message.IsUnread)
	// 	assert.True(t, message.IsMessage)

	// 	request, _ := http.NewRequest(
	// 		"PATCH",
	// 		"/messages/modify/"+gmailTaskIDHex+"/",
	// 		bytes.NewBuffer([]byte(`{"is_unread": true}`)))
	// 	request.Header.Add("Authorization", "Bearer "+authToken)
	// 	recorder := httptest.NewRecorder()

	// 	assert.NoError(t, err)

	// 	unreadRouter.ServeHTTP(recorder, request)
	// 	assert.Equal(t, http.StatusOK, recorder.Code)

	// 	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	// 	defer cancel()
	// 	err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
	// 	assert.True(t, message.IsUnread)
	// 	assert.True(t, message.IsMessage)
	// })

}

// func TestMarkMessageAsTask(t *testing.T) {
// 	parentCtx := context.Background()
// 	db, dbCleanup, err := database.GetDBConnection()
// 	assert.NoError(t, err)
// 	defer dbCleanup()

// 	authToken := login("approved@generaltask.com", "")
// 	userID := getUserIDFromAuthToken(t, db, authToken)

// 	taskCollection := database.GetTaskCollection(db)

// 	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
// 	defer cancel()
// 	insertResult, err := taskCollection.InsertOne(dbCtx,
// 		database.Item{
// 			TaskBase: database.TaskBase{
// 				UserID:     userID,
// 				IDExternal: "sample_gmail_id",
// 				SourceID:   external.TASK_SOURCE_ID_GMAIL,
// 			},
// 			Email: database.Email{
// 				IsUnread: true,
// 			},
// 			TaskType: database.TaskType{
// 				IsMessage: true,
// 			},
// 		},
// 	)
// 	assert.NoError(t, err)
// 	gmailTaskID := insertResult.InsertedID.(primitive.ObjectID)
// 	gmailTaskIDHex := gmailTaskID.Hex()

// 	t.Run("MarkMessageAsTask", func(t *testing.T) {
// 		unreadGmailModifyServer := getGmailChangeLabelServer(t, "UNREAD", false)

// 		api := GetAPI()
// 		api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &unreadGmailModifyServer.URL
// 		unreadRouter := GetRouter(api)

// 		var message database.Item
// 		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
// 		defer cancel()
// 		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
// 		assert.False(t, message.IsTask)
// 		assert.True(t, message.IsMessage)

// 		request, _ := http.NewRequest(
// 			"PATCH",
// 			"/messages/modify/"+gmailTaskIDHex+"/",
// 			bytes.NewBuffer([]byte(`{"is_task": true}`)))
// 		request.Header.Add("Authorization", "Bearer "+authToken)
// 		recorder := httptest.NewRecorder()

// 		assert.NoError(t, err)

// 		unreadRouter.ServeHTTP(recorder, request)
// 		assert.Equal(t, http.StatusOK, recorder.Code)

// 		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
// 		defer cancel()
// 		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
// 		assert.True(t, message.IsTask)
// 		assert.True(t, message.IsMessage)
// 	})

// 	t.Run("MarkMessageAsTaskAgain", func(t *testing.T) {
// 		unreadGmailModifyServer := getGmailChangeLabelServer(t, "UNREAD", false)

// 		api := GetAPI()
// 		api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &unreadGmailModifyServer.URL
// 		unreadRouter := GetRouter(api)

// 		var message database.Item
// 		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
// 		defer cancel()
// 		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
// 		assert.True(t, message.IsTask)
// 		assert.True(t, message.IsMessage)

// 		request, _ := http.NewRequest(
// 			"PATCH",
// 			"/messages/modify/"+gmailTaskIDHex+"/",
// 			bytes.NewBuffer([]byte(`{"is_task": true}`)))
// 		request.Header.Add("Authorization", "Bearer "+authToken)
// 		recorder := httptest.NewRecorder()

// 		assert.NoError(t, err)

// 		unreadRouter.ServeHTTP(recorder, request)
// 		assert.Equal(t, http.StatusOK, recorder.Code)

// 		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
// 		defer cancel()
// 		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
// 		assert.True(t, message.IsTask)
// 		assert.True(t, message.IsMessage)
// 	})

// 	t.Run("MarkMessageBackToNotTask", func(t *testing.T) {
// 		unreadGmailModifyServer := getGmailChangeLabelServer(t, "UNREAD", false)

// 		api := GetAPI()
// 		api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &unreadGmailModifyServer.URL
// 		unreadRouter := GetRouter(api)

// 		var message database.Item
// 		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
// 		defer cancel()
// 		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
// 		assert.True(t, message.IsTask)
// 		assert.True(t, message.IsMessage)

// 		request, _ := http.NewRequest(
// 			"PATCH",
// 			"/messages/modify/"+gmailTaskIDHex+"/",
// 			bytes.NewBuffer([]byte(`{"is_task": false}`)))
// 		request.Header.Add("Authorization", "Bearer "+authToken)
// 		recorder := httptest.NewRecorder()

// 		assert.NoError(t, err)

// 		unreadRouter.ServeHTTP(recorder, request)
// 		assert.Equal(t, http.StatusOK, recorder.Code)

// 		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
// 		defer cancel()
// 		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
// 		assert.False(t, message.IsTask)
// 		assert.True(t, message.IsMessage)
// 	})
// }

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
