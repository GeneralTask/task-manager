package api

import (
	"bytes"
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestTaskAddComment(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	notCompleted := false
	taskTitle := "Initial Title"
	taskBody := "Initial Body"
	taskTime := int64(60 * 60 * 1000 * 1000)
	taskPriorityID := "PriorityID"
	taskPriorityNormalized := 5.0
	taskNumber := 3

	timeNow := primitive.NewDateTimeFromTime(time.Now())

	sampleTask := database.Task{
		IDExternal:         "ID External",
		IDOrdering:         1,
		IDTaskSection:      constants.IDTaskSectionDefault,
		IsCompleted:        &notCompleted,
		Sender:             "Sender",
		SourceID:           external.TASK_SOURCE_ID_LINEAR,
		SourceAccountID:    "Source Account ID",
		Deeplink:           "Deeplink",
		Title:              &taskTitle,
		Body:               &taskBody,
		HasBeenReordered:   false,
		DueDate:            &timeNow,
		TimeAllocation:     &taskTime,
		CreatedAtExternal:  primitive.NewDateTimeFromTime(time.Now()),
		PriorityID:         &taskPriorityID,
		PriorityNormalized: &taskPriorityNormalized,
		TaskNumber:         &taskNumber,
	}

	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	response := `{"data": {"commentCreate": {
		"success": true
		}}}`
	taskUpdateServer := testutils.GetMockAPIServer(t, 200, response)
	api.ExternalConfig.Linear.ConfigValues.TaskUpdateURL = &taskUpdateServer.URL
	router := GetRouter(api)

	t.Run("AddCommentNotFound", func(t *testing.T) {
		authToken := login("not_supported@generaltask.com", "")
		invalidTaskID := primitive.NewObjectID()
		request, _ := http.NewRequest(
			"POST",
			"/tasks/"+invalidTaskID.Hex()+"/comments/add/",
			bytes.NewBuffer([]byte(`{"body": "Hello there!"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("AddCommentMalformedID", func(t *testing.T) {
		authToken := login("not_supported@generaltask.com", "")
		invalidTaskID := "HELLO!"
		request, _ := http.NewRequest(
			"POST",
			"/tasks/"+invalidTaskID+"/comments/add/",
			bytes.NewBuffer([]byte(`{"body": "Hello there!"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("AddCommentNotSupported", func(t *testing.T) {
		authToken := login("not_supported@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		expectedTask := sampleTask
		expectedTask.SourceID = external.TASK_SOURCE_ID_GCAL
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		request, _ := http.NewRequest(
			"POST",
			"/tasks/"+insertedTaskID.Hex()+"/comments/add/",
			bytes.NewBuffer([]byte(`{"body": "Hello there!"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusInternalServerError, recorder.Code)
	})
	t.Run("AddCommentTaskSourceNotFound", func(t *testing.T) {
		authToken := login("task_source_invalid@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		expectedTask := sampleTask
		expectedTask.SourceID = "oopsie"
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		request, _ := http.NewRequest(
			"POST",
			"/tasks/"+insertedTaskID.Hex()+"/comments/add/",
			bytes.NewBuffer([]byte(`{"body": "Hello there!"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusInternalServerError, recorder.Code)
	})
	t.Run("AddCommentEmpty", func(t *testing.T) {
		authToken := login("comment_empty@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		expectedTask := sampleTask
		expectedTask.SourceID = external.TASK_SOURCE_ID_GCAL
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		request, _ := http.NewRequest(
			"POST",
			"/tasks/"+insertedTaskID.Hex()+"/comments/add/",
			bytes.NewBuffer([]byte(`{}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})
	t.Run("AddCommentMalformedParams", func(t *testing.T) {
		authToken := login("comment_empty@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		expectedTask := sampleTask
		expectedTask.SourceID = external.TASK_SOURCE_ID_GCAL
		expectedTask.UserID = userID
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		request, _ := http.NewRequest(
			"POST",
			"/tasks/"+insertedTaskID.Hex()+"/comments/add/",
			bytes.NewBuffer([]byte(`{"body":3.0}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})
	t.Run("AddCommentSuccess", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

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

		request, _ := http.NewRequest(
			"POST",
			"/tasks/"+insertedTaskID.Hex()+"/comments/add/",
			bytes.NewBuffer([]byte(`{"body": "Hello there!"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Task
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		assert.Equal(t, "Hello there!", (*task.Comments)[0].Body)
	})
	t.Run("AddCommentSuccessWithExisting", func(t *testing.T) {
		authToken := login("success_multiple@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		expectedTask := sampleTask
		expectedTask.UserID = userID
		comment := database.Comment{
			Body: "original comment",
		}
		expectedTask.Comments = &[]database.Comment{comment}
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertResult, err := taskCollection.InsertOne(
			dbCtx,
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		request, _ := http.NewRequest(
			"POST",
			"/tasks/"+insertedTaskID.Hex()+"/comments/add/",
			bytes.NewBuffer([]byte(`{"body": "Hello there!"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Task
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		assert.Equal(t, "Hello there!", (*task.Comments)[1].Body)
	})
}
