package api

import (
	"bytes"
	"context"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/settings"
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

	testEmail := createRandomGTEmail()
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
					IsUnread:     true,
					SentAt:       *testutils.CreateDateTime("2018-04-20"),
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
		assert.True(t, threadItem.IsThread)
		assertThreadEmailsIsUnreadState(t, threadItem, true)

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
		assert.True(t, threadItem.IsThread)
		assertThreadEmailsIsUnreadState(t, threadItem, false)
	})

	t.Run("GmailSuccessUnread", func(t *testing.T) {
		settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyMarkAsRead)
		unreadGmailModifyServer := getGmailChangeLabelServer(t, "UNREAD", true)

		api := GetAPI()
		api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &unreadGmailModifyServer.URL
		unreadRouter := GetRouter(api)

		var threadItem database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": threadID}).Decode(&threadItem)
		assert.True(t, threadItem.IsThread)
		assertThreadEmailsIsUnreadState(t, threadItem, false)

		request, _ := http.NewRequest(
			"PATCH",
			"/threads/modify/"+threadIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_unread": true}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		unreadRouter.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": threadID}).Decode(&threadItem)
		assert.True(t, threadItem.IsThread)
		assertThreadEmailsIsUnreadState(t, threadItem, true)
	})

	t.Run("GmailSuccessArchive", func(t *testing.T) {
		settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)
		archivedGmailModifyServer := getGmailChangeLabelServer(t, "INBOX", false)

		api := GetAPI()
		api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &archivedGmailModifyServer.URL
		archivedRouter := GetRouter(api)

		var threadItem database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": threadID}).Decode(&threadItem)
		assert.True(t, threadItem.IsThread)
		assertThreadEmailsIsArchivedState(t, threadItem, false)

		request, _ := http.NewRequest(
			"PATCH",
			"/threads/modify/"+threadIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_archived": true}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		archivedRouter.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": threadID}).Decode(&threadItem)
		assert.True(t, threadItem.IsThread)
		assertThreadEmailsIsArchivedState(t, threadItem, true)
	})

	t.Run("GmailSuccessUnArchive", func(t *testing.T) {
		settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)
		archivedGmailModifyServer := getGmailChangeLabelServer(t, "INBOX", true)

		api := GetAPI()
		api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &archivedGmailModifyServer.URL
		archivedRouter := GetRouter(api)

		var threadItem database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": threadID}).Decode(&threadItem)
		assert.True(t, threadItem.IsThread)
		assertThreadEmailsIsArchivedState(t, threadItem, true)

		request, _ := http.NewRequest(
			"PATCH",
			"/threads/modify/"+threadIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_archived": false}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		archivedRouter.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": threadID}).Decode(&threadItem)
		assert.True(t, threadItem.IsThread)
		assertThreadEmailsIsArchivedState(t, threadItem, false)
	})

	t.Run("BadParamGmailArchive", func(t *testing.T) {
		settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)

		api := GetAPI()
		archivedRouter := GetRouter(api)

		var threadItem database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": threadID}).Decode(&threadItem)
		assert.True(t, threadItem.IsThread)
		assertThreadEmailsIsArchivedState(t, threadItem, false)

		request, _ := http.NewRequest(
			"PATCH",
			"/threads/modify/"+threadIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_archived": foobar}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		archivedRouter.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": threadID}).Decode(&threadItem)
		assert.True(t, threadItem.IsThread)
		assertThreadEmailsIsArchivedState(t, threadItem, false)
	})

	t.Run("ServerErrorGmailArchive", func(t *testing.T) {
		settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)
		archivedGmailModifyServer := getGmailInternalErrorServer(t)

		api := GetAPI()
		api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &archivedGmailModifyServer.URL
		archivedRouter := GetRouter(api)

		var threadItem database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": threadID}).Decode(&threadItem)
		assert.True(t, threadItem.IsThread)
		assertThreadEmailsIsArchivedState(t, threadItem, false)

		request, _ := http.NewRequest(
			"PATCH",
			"/threads/modify/"+threadIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_archived": true}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		archivedRouter.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusInternalServerError, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": threadID}).Decode(&threadItem)
		assert.True(t, threadItem.IsThread)
		assertThreadEmailsIsArchivedState(t, threadItem, false)
	})
}
