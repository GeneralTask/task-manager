package api

import (
	"bytes"
	"context"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/settings"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestMarkAsComplete(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.io", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	taskCollection := db.Collection("tasks")

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	insertResult, err := taskCollection.InsertOne(dbCtx, database.TaskBase{
		UserID:     userID,
		IDExternal: "sample_jira_id",
		SourceID:   external.TASK_SOURCE_ID_JIRA,
	})
	assert.NoError(t, err)
	jiraTaskID := insertResult.InsertedID.(primitive.ObjectID)
	jiraTaskIDHex := jiraTaskID.Hex()

	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	insertResult, err = taskCollection.InsertOne(dbCtx, database.TaskBase{
		UserID:     userID,
		IDExternal: "sample_gmail_id",
		SourceID:   external.TASK_SOURCE_ID_GMAIL,
	})
	assert.NoError(t, err)
	gmailTaskID := insertResult.InsertedID.(primitive.ObjectID)
	gmailTaskIDHex := gmailTaskID.Hex()

	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	insertResult, err = taskCollection.InsertOne(dbCtx, database.TaskBase{
		UserID:     userID,
		IDExternal: "sample_calendar_id",
		SourceID:   external.TASK_SOURCE_ID_GCAL,
	})
	assert.NoError(t, err)
	calendarTaskID := insertResult.InsertedID.(primitive.ObjectID)
	calendarTaskIDHex := calendarTaskID.Hex()

	externalAPITokenCollection := db.Collection("external_api_tokens")

	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = externalAPITokenCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{{"user_id": userID}, {"service_id": external.TaskSourceJIRA.Name}}},
		bson.M{"$set": &database.ExternalAPIToken{
			ServiceID: external.TASK_SERVICE_ID_ATLASSIAN,
			Token:     `{"access_token":"sample-token","refresh_token":"sample-token","scope":"sample-scope","expires_in":3600,"token_type":"Bearer"}`,
			UserID:    userID,
		}},
		options.Update().SetUpsert(true),
	)
	assert.NoError(t, err)

	AtlassianSiteCollection := db.Collection("jira_sites")
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = AtlassianSiteCollection.UpdateOne(
		dbCtx,
		bson.M{"user_id": userID},

		bson.M{"$set": &database.AtlassianSiteConfiguration{
			UserID:  userID,
			CloudID: "sample_cloud_id",
			SiteURL: "https://generaltasktester.atlassian.com",
		}},
		options.Update().SetUpsert(true),
	)
	assert.NoError(t, err)

	jiraTransitionServer := getTransitionIDServerForJIRA(t)
	tokenServer := getTokenServerForJIRA(t, http.StatusOK)

	inboxGmailModifyServer := getGmailArchiveServer(t, "INBOX")

	api := GetAPI()
	api.ExternalConfig.Atlassian.ConfigValues.TokenURL = &tokenServer.URL
	api.ExternalConfig.Atlassian.ConfigValues.TransitionURL = &jiraTransitionServer.URL
	api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &inboxGmailModifyServer.URL
	router := GetRouter(api)

	t.Run("MissingCompletionFlag", func(t *testing.T) {
		err := settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)
		assert.NoError(t, err)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+jiraTaskIDHex+"/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})

	t.Run("CompletionFlagFalse", func(t *testing.T) {
		err := settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)
		assert.NoError(t, err)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+jiraTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": false}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})

	t.Run("InvalidHex", func(t *testing.T) {
		err := settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)
		assert.NoError(t, err)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+jiraTaskIDHex+"1/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})

	t.Run("InvalidUser", func(t *testing.T) {
		err := settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)
		assert.NoError(t, err)
		ogAuth := authToken
		log.Println(ogAuth)
		secondAuthToken := login("tester@generaltask.io", "")
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+jiraTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		request.Header.Add("Authorization", "Bearer "+secondAuthToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})

	t.Run("JIRASuccessInbox", func(t *testing.T) {
		err := settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)
		assert.NoError(t, err)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+jiraTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		var task database.TaskBase
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": jiraTaskID}).Decode(&task)
		assert.Equal(t, false, task.IsCompleted)

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": jiraTaskID}).Decode(&task)
		assert.Equal(t, true, task.IsCompleted)

		assert.NoError(t, err)
	})

	t.Run("JIRASuccessUnread", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err = taskCollection.InsertOne(dbCtx, database.TaskBase{
			UserID:     userID,
			IDExternal: "sample_jira_id",
			SourceID:   external.TASK_SOURCE_ID_JIRA,
		})
		assert.NoError(t, err)
		jiraTaskID = insertResult.InsertedID.(primitive.ObjectID)
		jiraTaskIDHex = jiraTaskID.Hex()

		settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyMarkAsRead)

		unreadGmailModifyServer := getGmailArchiveServer(t, "UNREAD")

		api := GetAPI()
		api.ExternalConfig.Atlassian.ConfigValues.TokenURL = &tokenServer.URL
		api.ExternalConfig.Atlassian.ConfigValues.TransitionURL = &jiraTransitionServer.URL
		api.ExternalConfig.GoogleOverrideURLs.GmailModifyURL = &unreadGmailModifyServer.URL
		unreadRouter := GetRouter(api)

		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+jiraTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))

		var task database.TaskBase
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": jiraTaskID}).Decode(&task)
		assert.Equal(t, false, task.IsCompleted)

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		unreadRouter.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": jiraTaskID}).Decode(&task)
		assert.Equal(t, true, task.IsCompleted)
	})

	t.Run("GmailSuccess", func(t *testing.T) {
		settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+gmailTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		var task database.TaskBase
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&task)
		assert.Equal(t, false, task.IsCompleted)

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&task)
		assert.Equal(t, true, task.IsCompleted)
	})

	t.Run("CalendarFailure", func(t *testing.T) {
		settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+calendarTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		var task database.TaskBase
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": calendarTaskID}).Decode(&task)
		assert.Equal(t, false, task.IsCompleted)

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": calendarTaskID}).Decode(&task)
		assert.Equal(t, false, task.IsCompleted)
	})
}

func TestTaskReorder(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := db.Collection("tasks")
	t.Run("Success", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			database.TaskBase{
				UserID:        userID,
				IDOrdering:    2,
				IDTaskSection: constants.IDTaskSectionToday,
			},
		)
		assert.NoError(t, err)
		taskToBeMovedID := insertResult.InsertedID.(primitive.ObjectID)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err = taskCollection.InsertOne(
			dbCtx,
			database.TaskBase{
				UserID:        primitive.NewObjectID(),
				IDOrdering:    3,
				IDTaskSection: constants.IDTaskSectionToday,
			},
		)
		assert.NoError(t, err)
		taskToNotBeMovedID := insertResult.InsertedID.(primitive.ObjectID)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err = taskCollection.InsertOne(
			dbCtx,
			database.TaskBase{
				UserID:        userID,
				IDOrdering:    1,
				IDTaskSection: constants.IDTaskSectionToday,
			},
		)
		assert.NoError(t, err)
		taskToAlsoNotBeMovedID := insertResult.InsertedID.(primitive.ObjectID)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err = taskCollection.InsertOne(
			dbCtx,
			database.TaskBase{
				UserID:        userID,
				IDOrdering:    2,
				IDTaskSection: constants.IDTaskSectionBacklog,
			},
		)
		assert.NoError(t, err)
		taskToAlsoAlsoNotBeMovedID := insertResult.InsertedID.(primitive.ObjectID)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err = taskCollection.InsertOne(
			dbCtx,
			database.TaskBase{
				UserID:        userID,
				IDTaskSection: constants.IDTaskSectionBacklog,
			},
		)
		assert.NoError(t, err)
		taskID := insertResult.InsertedID.(primitive.ObjectID)
		taskIDHex := taskID.Hex()

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2, "id_task_section": "`+constants.IDTaskSectionToday.Hex()+`"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.TaskBase
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": taskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 2, task.IDOrdering)
		assert.Equal(t, constants.IDTaskSectionToday, task.IDTaskSection)
		assert.True(t, task.HasBeenReordered)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": taskToBeMovedID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 3, task.IDOrdering)
		assert.False(t, task.HasBeenReordered)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": taskToNotBeMovedID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 3, task.IDOrdering)
		assert.False(t, task.HasBeenReordered)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": taskToAlsoNotBeMovedID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 1, task.IDOrdering)
		assert.False(t, task.HasBeenReordered)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": taskToAlsoAlsoNotBeMovedID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 2, task.IDOrdering)
		assert.False(t, task.HasBeenReordered)
	})
	t.Run("WrongUser", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(dbCtx, database.TaskBase{})
		assert.NoError(t, err)
		taskID := insertResult.InsertedID.(primitive.ObjectID)
		taskIDHex := taskID.Hex()

		authToken := login("approved@generaltask.io", "")
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("MissingOrderingID", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+primitive.NewObjectID().Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"Parameter missing or malformatted\"}", string(body))
	})
	t.Run("BadTaskID", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+primitive.NewObjectID().Hex()+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("WrongFormatTaskID", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/123/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("BadTaskSectionIDFormat", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+primitive.NewObjectID().Hex()+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2, "id_task_section": "poop"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"'id_task_section' is not a valid ID\"}", string(body))
	})
	t.Run("BadTaskSectionID", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+primitive.NewObjectID().Hex()+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2, "id_task_section": "`+primitive.NewObjectID().Hex()+`"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"'id_task_section' is not a valid ID\"}", string(body))
	})
	t.Run("OnlyReorderTaskSections", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			database.TaskBase{
				UserID:        userID,
				IDTaskSection: constants.IDTaskSectionBacklog,
			},
		)
		assert.NoError(t, err)
		taskID := insertResult.InsertedID.(primitive.ObjectID)
		taskIDHex := taskID.Hex()

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_task_section": "`+constants.IDTaskSectionToday.Hex()+`"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.TaskBase
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": taskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 0, task.IDOrdering)
		assert.Equal(t, constants.IDTaskSectionToday, task.IDTaskSection)
		assert.True(t, task.HasBeenReordered)
	})
	t.Run("OnlyReorderingID", func(t *testing.T) {
		authToken := login("approved@generaltask.io", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			database.TaskBase{
				UserID:        userID,
				IDTaskSection: constants.IDTaskSectionBacklog,
			},
		)
		assert.NoError(t, err)
		taskID := insertResult.InsertedID.(primitive.ObjectID)
		taskIDHex := taskID.Hex()

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.TaskBase
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": taskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 2, task.IDOrdering)
		assert.Equal(t, constants.IDTaskSectionBacklog, task.IDTaskSection)
		assert.True(t, task.HasBeenReordered)
	})
	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/123/", nil)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
}
