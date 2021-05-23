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

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestMarkAsComplete(t *testing.T) {
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()

	authToken := login("approved@generaltask.io")
	userID := getUserIDFromAuthToken(t, db, authToken)

	taskCollection := db.Collection("tasks")

	insertResult, err := taskCollection.InsertOne(nil, database.TaskBase{
		UserID:     userID,
		IDExternal: "sample_jira_id",
		Source:     database.TaskSourceJIRA.Name,
	})
	assert.NoError(t, err)
	jiraTaskID := insertResult.InsertedID.(primitive.ObjectID)
	jiraTaskIDHex := jiraTaskID.Hex()

	insertResult, err = taskCollection.InsertOne(nil, database.TaskBase{
		UserID:     userID,
		IDExternal: "sample_gmail_id",
		Source:     database.TaskSourceGmail.Name,
	})
	assert.NoError(t, err)
	gmailTaskID := insertResult.InsertedID.(primitive.ObjectID)
	gmailTaskIDHex := gmailTaskID.Hex()

	insertResult, err = taskCollection.InsertOne(nil, database.TaskBase{
		UserID:     userID,
		IDExternal: "sample_calendar_id",
		Source:     database.TaskSourceGoogleCalendar.Name,
	})
	assert.NoError(t, err)
	calendarTaskID := insertResult.InsertedID.(primitive.ObjectID)
	calendarTaskIDHex := calendarTaskID.Hex()

	externalAPITokenCollection := db.Collection("external_api_tokens")

	_, err = externalAPITokenCollection.UpdateOne(
		nil,
		bson.D{{"user_id", userID}, {"source", database.TaskSourceJIRA.Name}},
		bson.D{{"$set", &database.ExternalAPIToken{
			Source: database.TaskSourceJIRA.Name,
			Token:  `{"access_token":"sample-token","refresh_token":"sample-token","scope":"sample-scope","expires_in":3600,"token_type":"Bearer"}`,
			UserID: userID,
		}}},
		options.Update().SetUpsert(true),
	)
	assert.NoError(t, err)

	settingsCollection := db.Collection("user_settings")

	_, err = settingsCollection.UpdateOne(
		context.TODO(),
		bson.D{{Key: "user_id", Value: userID}, {Key: "field_key", Value: SettingFieldEmailDonePreference}},
		bson.D{{Key: "$set", Value: &database.UserSetting{
			UserID:     userID,
			FieldKey:   SettingFieldEmailDonePreference,
			FieldValue: ChoiceKeyArchive,
		}}},
		options.Update().SetUpsert(true),
	)

	assert.NoError(t, err)

	jiraSiteCollection := db.Collection("jira_site_collection")
	_, err = jiraSiteCollection.UpdateOne(
		nil,
		bson.D{{"user_id", userID}},

		bson.D{{"$set", &database.JIRASiteConfiguration{
			UserID:  userID,
			CloudID: "sample_cloud_id",
			SiteURL: "https://generaltasktester.atlassian.com",
		}}},
		options.Update().SetUpsert(true),
	)
	assert.NoError(t, err)

	jiraTransitionServer := getTransitionIDServerForJIRA(t)
	tokenServer := getTokenServerForJIRA(t, http.StatusOK)



	gmailModifyServer := getGmailArchiveServer(t, "INBOX")

	router := GetRouter(&API{
		JIRAConfigValues: JIRAConfig{
			TokenURL:      &tokenServer.URL,
			TransitionURL: &jiraTransitionServer.URL,
		},
		GoogleURLs: GoogleURLOverrides{GmailModifyURL: &gmailModifyServer.URL},
	})

	t.Run("MissingCompletionFlag", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/"+jiraTaskIDHex+"/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})

	t.Run("CompletionFlagFalse", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/"+jiraTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": false}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})

	t.Run("InvalidHex", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/"+jiraTaskIDHex+"1/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})

	t.Run("InvalidUser", func(t *testing.T) {
		ogAuth := authToken
		log.Println(ogAuth)
		secondAuthToken := login("tester@generaltask.io")
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/"+jiraTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		request.Header.Add("Authorization", "Bearer "+secondAuthToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})

	t.Run("JIRASuccess", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/"+jiraTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))

		var task database.TaskBase
		err = taskCollection.FindOne(nil, bson.D{{"_id", jiraTaskID}}).Decode(&task)
		assert.Equal(t, false, task.IsCompleted)

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()

		assert.NoError(t, err)

		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		err = taskCollection.FindOne(nil, bson.D{{"_id", jiraTaskID}}).Decode(&task)
		assert.Equal(t, true, task.IsCompleted)
	})

	t.Run("GmailSuccess", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/"+gmailTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		var task database.TaskBase
		err = taskCollection.FindOne(nil, bson.D{{"_id", gmailTaskID}}).Decode(&task)
		assert.Equal(t, false, task.IsCompleted)

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		err = taskCollection.FindOne(nil, bson.D{{"_id", gmailTaskID}}).Decode(&task)
		assert.Equal(t, true, task.IsCompleted)
	})

	t.Run("CalendarFailure", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/"+calendarTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		var task database.TaskBase
		err = taskCollection.FindOne(nil, bson.D{{"_id", calendarTaskID}}).Decode(&task)
		assert.Equal(t, false, task.IsCompleted)

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		err = taskCollection.FindOne(nil, bson.D{{"_id", calendarTaskID}}).Decode(&task)
		assert.Equal(t, false, task.IsCompleted)
	})
}

func TestTaskReorder(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		db, dbCleanup := database.GetDBConnection()
		defer dbCleanup()
		taskCollection := db.Collection("tasks")
		insertResult, err := taskCollection.InsertOne(context.TODO(), database.TaskBase{})
		assert.NoError(t, err)
		taskID := insertResult.InsertedID.(primitive.ObjectID)
		taskIDHex := taskID.Hex()

		authToken := login("approved@generaltask.io")
		router := GetRouter(&API{})
		request, _ := http.NewRequest("PATCH", "/tasks/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.TaskBase
		err = taskCollection.FindOne(context.TODO(), bson.D{{Key: "_id", Value: taskID}}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 2, task.IDOrdering)
		assert.True(t, task.HasBeenReordered)
	})
	t.Run("MissingOrderingID", func(t *testing.T) {
		authToken := login("approved@generaltask.io")
		router := GetRouter(&API{})
		request, _ := http.NewRequest("PATCH", "/tasks/"+primitive.NewObjectID().Hex()+"/", nil)
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
		authToken := login("approved@generaltask.io")
		router := GetRouter(&API{})
		request, _ := http.NewRequest("PATCH", "/tasks/"+primitive.NewObjectID().Hex()+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
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
		authToken := login("approved@generaltask.io")
		router := GetRouter(&API{})
		request, _ := http.NewRequest("PATCH", "/tasks/123/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("PATCH", "/tasks/123/", nil)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
}
