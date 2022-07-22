package api

import (
	"bytes"
	"context"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/settings"
	"github.com/GeneralTask/task-manager/backend/utils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestMarkAsComplete(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	taskCollection := database.GetTaskCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	insertResult, err := taskCollection.InsertOne(dbCtx, database.Item{
		TaskBase: database.TaskBase{
			UserID:     userID,
			IDExternal: "sample_jira_id",
			SourceID:   external.TASK_SOURCE_ID_JIRA,
		},
		TaskType: database.TaskType{IsTask: true},
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

	externalAPITokenCollection := database.GetExternalTokenCollection(db)

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

	inboxGmailModifyServer := getGmailArchiveServer(t, "INBOX")

	api := GetAPI()
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
		err := database.MarkItemComplete(db, jiraTaskID)
		assert.NoError(t, err)
		err = settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)
		assert.NoError(t, err)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+jiraTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": false}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		tasks, err := database.GetCompletedTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 0, len(*tasks))
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
		secondAuthToken := login("tester@generaltask.com", "")
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+jiraTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		request.Header.Add("Authorization", "Bearer "+secondAuthToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
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
		assert.NotEqual(t, primitive.DateTime(0), task.CompletedAt)
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

	t.Run("Mark complete and edit fields success", func(t *testing.T) {
		settings.UpdateUserSetting(db, userID, settings.SettingFieldEmailDonePreference, settings.ChoiceKeyArchive)
		dueDate, err := time.Parse(time.RFC3339, "2021-12-06T07:39:00-15:13")
		assert.NoError(t, err)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+gmailTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{
				"time_duration": 20,
				"due_date": "`+dueDate.Format(time.RFC3339)+`",
				"title": "New Title",
				"body": "New Body",
				"is_completed": true
				}`)))
		var task database.TaskBase
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, true, task.IsCompleted)

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": gmailTaskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, true, task.IsCompleted)
	})
}

func TestTaskReorder(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	authToken := login("approved@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	t.Run("Success", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			database.TaskBase{
				UserID:        userID,
				IDOrdering:    2,
				IDTaskSection: constants.IDTaskSectionDefault,
				SourceID:      external.TASK_SOURCE_ID_LINEAR,
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
				IDTaskSection: constants.IDTaskSectionDefault,
				SourceID:      external.TASK_SOURCE_ID_LINEAR,
			},
		)
		assert.NoError(t, err)
		taskToNotBeMovedID := insertResult.InsertedID.(primitive.ObjectID)

		customTaskSectionID := primitive.NewObjectID()
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err = taskCollection.InsertOne(
			dbCtx,
			database.TaskBase{
				UserID:        userID,
				IDOrdering:    1,
				IDTaskSection: customTaskSectionID,
				SourceID:      external.TASK_SOURCE_ID_LINEAR,
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
				IDTaskSection: customTaskSectionID,
				SourceID:      external.TASK_SOURCE_ID_LINEAR,
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
				IDTaskSection: constants.IDTaskSectionDefault,
				SourceID:      external.TASK_SOURCE_ID_LINEAR,
			},
		)
		assert.NoError(t, err)
		taskID := insertResult.InsertedID.(primitive.ObjectID)
		taskIDHex := taskID.Hex()

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2, "id_task_section": "`+constants.IDTaskSectionDefault.Hex()+`"}`)))
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
		assert.Equal(t, constants.IDTaskSectionDefault, task.IDTaskSection)
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

		authToken := login("approved@generaltask.com", "")
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"task not found.\",\"taskId\":\""+taskIDHex+"\"}", string(body))
	})
	t.Run("MissingOrderingID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+primitive.NewObjectID().Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"parameter missing or malformatted\"}", string(body))
	})
	t.Run("BadTaskID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		router := GetRouter(GetAPI())
		taskIDHex := primitive.NewObjectID().Hex()
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"task not found.\",\"taskId\":\""+taskIDHex+"\"}", string(body))
	})
	t.Run("WrongFormatTaskID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
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
		authToken := login("approved@generaltask.com", "")
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
	t.Run("OnlyReorderTaskSections", func(t *testing.T) {

		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			database.TaskBase{
				UserID:        userID,
				IDTaskSection: constants.IDTaskSectionDefault,
				SourceID:      external.TASK_SOURCE_ID_LINEAR,
			},
		)
		assert.NoError(t, err)
		taskID := insertResult.InsertedID.(primitive.ObjectID)
		taskIDHex := taskID.Hex()

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_task_section": "`+constants.IDTaskSectionDefault.Hex()+`"}`)))
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
		assert.Equal(t, constants.IDTaskSectionDefault, task.IDTaskSection)
		assert.True(t, task.HasBeenReordered)
	})
	t.Run("OnlyReorderingID", func(t *testing.T) {

		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			database.TaskBase{
				UserID:        userID,
				IDTaskSection: constants.IDTaskSectionDefault,
				SourceID:      external.TASK_SOURCE_ID_LINEAR,
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
		assert.Equal(t, constants.IDTaskSectionDefault, task.IDTaskSection)
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

func TestEditFields(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	authToken := login("approved@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	sampleTask := database.Item{
		TaskBase: database.TaskBase{
			IDExternal:       "ID External",
			IDOrdering:       1,
			IDTaskSection:    constants.IDTaskSectionDefault,
			IsCompleted:      false,
			Sender:           "Sender",
			SourceID:         "gt_task",
			SourceAccountID:  "Source Account ID",
			Deeplink:         "Deeplink",
			Title:            "Initial Title",
			Body:             "Initial Body",
			HasBeenReordered: false,
			DueDate:          primitive.NewDateTimeFromTime(time.Now()),
			TimeAllocation:   60 * 60 * 1000 * 1000,
			ConferenceCall: &database.ConferenceCall{
				Platform: "Google Meet",
				Logo:     "https://google.com/logo.png",
				URL:      "https://meet.google.com/",
			},
			CreatedAtExternal: primitive.NewDateTimeFromTime(time.Now()),
		},
		Task: database.Task{
			PriorityID:         "Priority ID",
			PriorityNormalized: 5.0,
			TaskNumber:         3,
		},
	}

	t.Run("Edit Title Success on Task from Thread", func(t *testing.T) {
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

		ServeRequest(t, authToken, "POST", "/create_task_from_thread/"+threadIDHex+"/",
			bytes.NewBuffer([]byte(`{
				"title": "sample title from thread",
				"body": "sample body",
				"email_id": "`+firstEmailID.Hex()+`"
			}`)), http.StatusOK)
		var task database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = database.GetTaskCollection(db).FindOne(dbCtx, bson.M{"title": "sample title from thread", "user_id": userID}).Decode(&task)
		assert.NoError(t, err)
		assert.True(t, task.IsTask)
		assert.Equal(t, threadID, *task.LinkedMessage.ThreadID)
		assert.Equal(t, firstEmailID, *task.LinkedMessage.EmailID)

		ServeRequest(t, authToken, "PATCH", "/tasks/modify/"+task.ID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"title": "New title from thread"}`)), http.StatusOK)

		var taskAfterModify database.Item
		err = database.GetTaskCollection(db).FindOne(dbCtx, bson.M{"title": "New title from thread", "user_id": userID}).Decode(&taskAfterModify)
		assert.NoError(t, err)
		assert.True(t, taskAfterModify.IsTask)
		assert.Equal(t, threadID, *taskAfterModify.LinkedMessage.ThreadID)
		assert.Equal(t, firstEmailID, *taskAfterModify.LinkedMessage.EmailID)
		assert.Equal(t, task.ID, taskAfterModify.ID)
	})

	t.Run("Edit Title Success", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"title": "New title"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Item
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		expectedTask.Title = "New title"
		utils.AssertTasksEqual(t, &expectedTask, &task)
	})

	t.Run("Edit Title Empty", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"title": ""}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"title cannot be empty\"}", string(body))
	})

	t.Run("Edit Body Success", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"body": "New Body"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Item
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		expectedTask.TaskBase.Body = "New Body"
		utils.AssertTasksEqual(t, &expectedTask, &task)
	})
	t.Run("Edit Due Date Success", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		dueDate, err := time.Parse(time.RFC3339, "2021-12-06T07:39:00-15:13")
		assert.NoError(t, err)

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"due_date": "`+dueDate.Format(time.RFC3339)+`"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Item
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		expectedTask.DueDate = primitive.NewDateTimeFromTime(dueDate)
		utils.AssertTasksEqual(t, &expectedTask, &task)
	})
	t.Run("Edit Due Date Empty", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"due_date": ""}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"parameter missing or malformatted\"}", string(body))
	})
	t.Run("Edit Time Duration Success", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"time_duration": 20}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Item
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		expectedTask.TimeAllocation = int64(20 * 1000 * 1000)
		utils.AssertTasksEqual(t, &expectedTask, &task)
	})
	t.Run("Edit Time Duration Negative", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"time_duration": -20}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"time duration cannot be negative\"}", string(body))
	})
	t.Run("Edit multiple fields success", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		dueDate, err := time.Parse(time.RFC3339, "2021-12-06T07:39:00-15:13")
		assert.NoError(t, err)

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{
				"time_duration": 20,
				"due_date": "`+dueDate.Format(time.RFC3339)+`",
				"title": "New Title",
				"body": "New Body"
				}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Item
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		expectedTask.Title = "New Title"
		expectedTask.TaskBase.Body = "New Body"
		expectedTask.DueDate = primitive.NewDateTimeFromTime(dueDate)
		expectedTask.TimeAllocation = int64(20 * 1000 * 1000)

		utils.AssertTasksEqual(t, &expectedTask, &task)
	})

	t.Run("Edit multiple fields empty title", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		dueDate, err := time.Parse(time.RFC3339, "2021-12-06T07:39:00-15:13")
		assert.NoError(t, err)

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{
				"time_duration": 20,
				"due_date": "`+dueDate.Format(time.RFC3339)+`",
				"title": "",
				"body": "New Body"
				}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"title cannot be empty\"}", string(body))
	})

	t.Run("Edit zero fields", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"parameter missing\"}", string(body))
	})
}
