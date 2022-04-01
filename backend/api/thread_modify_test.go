package api

import (
	"bytes"
	"context"

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

	authToken := login("approved@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	taskCollection := database.GetTaskCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	insertResult, err := taskCollection.InsertOne(dbCtx,
		database.Item{
			TaskBase: database.TaskBase{
				UserID:     userID,
				IDExternal: "sample_gmail_id",
				SourceID:   external.TASK_SOURCE_ID_GMAIL,
			},
			Email: database.Email{
				IsUnread: true,
			},
			TaskType: database.TaskType{
				IsMessage: true,
			},
		},
	)
	assert.NoError(t, err)
	gmailTaskID := insertResult.InsertedID.(primitive.ObjectID)
	gmailTaskIDHex := gmailTaskID.Hex()

	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"PATCH",
			"/messages/modify/"+gmailTaskIDHex+"/", nil)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})

	t.Run("InvalidUser", func(t *testing.T) {
		router := GetRouter(GetAPI())

		secondAuthToken := login("tester@generaltask.com", "")
		request, _ := http.NewRequest(
			"PATCH",
			"/messages/modify/"+gmailTaskIDHex+"/",
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
			"/messages/modify/"+gmailTaskIDHex+"random_suffix/",
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
			"/tasks/modify/"+gmailTaskIDHex+"/",
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

		var message database.Item
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
		assert.True(t, message.IsUnread)
		assert.True(t, message.IsMessage)

		request, _ := http.NewRequest(
			"PATCH",
			"/messages/modify/"+gmailTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_unread": false}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		unreadRouter.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
		assert.False(t, message.IsUnread)
		assert.True(t, message.IsMessage)
	})

	t.Run("GmailSuccessUnread", func(t *testing.T) {
		settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyMarkAsRead)
		unreadGmailModifyServer := getGmailChangeLabelServer(t, "UNREAD", true)

		api := GetAPI()
		api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &unreadGmailModifyServer.URL
		unreadRouter := GetRouter(api)

		var message database.Item
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
		assert.False(t, message.IsUnread)
		assert.True(t, message.IsMessage)

		request, _ := http.NewRequest(
			"PATCH",
			"/messages/modify/"+gmailTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_unread": true}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		unreadRouter.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
		assert.True(t, message.IsUnread)
		assert.True(t, message.IsMessage)
	})

}

func TestMarkMessageAsTask(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	taskCollection := database.GetTaskCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	insertResult, err := taskCollection.InsertOne(dbCtx,
		database.Item{
			TaskBase: database.TaskBase{
				UserID:     userID,
				IDExternal: "sample_gmail_id",
				SourceID:   external.TASK_SOURCE_ID_GMAIL,
			},
			Email: database.Email{
				IsUnread: true,
			},
			TaskType: database.TaskType{
				IsMessage: true,
			},
		},
	)
	assert.NoError(t, err)
	gmailTaskID := insertResult.InsertedID.(primitive.ObjectID)
	gmailTaskIDHex := gmailTaskID.Hex()

	t.Run("MarkMessageAsTask", func(t *testing.T) {
		unreadGmailModifyServer := getGmailChangeLabelServer(t, "UNREAD", false)

		api := GetAPI()
		api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &unreadGmailModifyServer.URL
		unreadRouter := GetRouter(api)

		var message database.Item
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
		assert.False(t, message.IsTask)
		assert.True(t, message.IsMessage)

		request, _ := http.NewRequest(
			"PATCH",
			"/messages/modify/"+gmailTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_task": true}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		unreadRouter.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
		assert.True(t, message.IsTask)
		assert.True(t, message.IsMessage)
	})

	t.Run("MarkMessageAsTaskAgain", func(t *testing.T) {
		unreadGmailModifyServer := getGmailChangeLabelServer(t, "UNREAD", false)

		api := GetAPI()
		api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &unreadGmailModifyServer.URL
		unreadRouter := GetRouter(api)

		var message database.Item
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
		assert.True(t, message.IsTask)
		assert.True(t, message.IsMessage)

		request, _ := http.NewRequest(
			"PATCH",
			"/messages/modify/"+gmailTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_task": true}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		unreadRouter.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
		assert.True(t, message.IsTask)
		assert.True(t, message.IsMessage)
	})

	t.Run("MarkMessageBackToNotTask", func(t *testing.T) {
		unreadGmailModifyServer := getGmailChangeLabelServer(t, "UNREAD", false)

		api := GetAPI()
		api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &unreadGmailModifyServer.URL
		unreadRouter := GetRouter(api)

		var message database.Item
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
		assert.True(t, message.IsTask)
		assert.True(t, message.IsMessage)

		request, _ := http.NewRequest(
			"PATCH",
			"/messages/modify/"+gmailTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_task": false}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		unreadRouter.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&message)
		assert.False(t, message.IsTask)
		assert.True(t, message.IsMessage)
	})
}
