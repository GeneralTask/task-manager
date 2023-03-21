package api

import (
	"bytes"
	"context"
	"net/http"
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
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	notCompleted := false
	taskTitle := "Initial Title"
	taskBody := "Initial Body"
	taskTime := int64(60 * 60 * 1000 * 1000)
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

	t.Run("AddCommentNotFound", func(t *testing.T) {
		authToken := login("not_supported@generaltask.com", "")
		invalidTaskID := primitive.NewObjectID()
		ServeRequest(t, authToken, "POST", "/tasks/"+invalidTaskID.Hex()+"/comments/add/", bytes.NewBuffer([]byte(`{"body": "Hello there!"}`)), http.StatusNotFound, api)
	})
	t.Run("AddCommentMalformedID", func(t *testing.T) {
		authToken := login("not_supported@generaltask.com", "")
		invalidTaskID := "HELLO!"
		ServeRequest(t, authToken, "POST", "/tasks/"+invalidTaskID+"/comments/add/", bytes.NewBuffer([]byte(`{"body": "Hello there!"}`)), http.StatusNotFound, api)
	})
	t.Run("AddCommentNotSupported", func(t *testing.T) {
		authToken := login("not_supported@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		expectedTask := sampleTask
		expectedTask.SourceID = external.TASK_SOURCE_ID_GCAL
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)
		ServeRequest(t, authToken, "POST", "/tasks/"+insertedTaskID.Hex()+"/comments/add/", bytes.NewBuffer([]byte(`{"body": "Hello there!"}`)), http.StatusInternalServerError, api)
	})
	t.Run("AddCommentTaskSourceNotFound", func(t *testing.T) {
		authToken := login("task_source_invalid@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		expectedTask := sampleTask
		expectedTask.SourceID = "oopsie"
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)
		ServeRequest(t, authToken, "POST", "/tasks/"+insertedTaskID.Hex()+"/comments/add/", bytes.NewBuffer([]byte(`{"body": "Hello there!"}`)), http.StatusInternalServerError, api)
	})
	t.Run("AddCommentEmpty", func(t *testing.T) {
		authToken := login("comment_empty@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		expectedTask := sampleTask
		expectedTask.SourceID = external.TASK_SOURCE_ID_GCAL
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)
		ServeRequest(t, authToken, "POST", "/tasks/"+insertedTaskID.Hex()+"/comments/add/", bytes.NewBuffer([]byte(`{}`)), http.StatusBadRequest, api)
	})
	t.Run("AddCommentMalformedParams", func(t *testing.T) {
		authToken := login("comment_empty@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		expectedTask := sampleTask
		expectedTask.SourceID = external.TASK_SOURCE_ID_GCAL
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)
		ServeRequest(t, authToken, "POST", "/tasks/"+insertedTaskID.Hex()+"/comments/add/", bytes.NewBuffer([]byte(`{"body":3.0}`)), http.StatusBadRequest, api)
	})
	t.Run("AddCommentSuccess", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)
		responseBody := ServeRequest(t, authToken, "POST", "/tasks/"+insertedTaskID.Hex()+"/comments/add/", bytes.NewBuffer([]byte(`{"body": "Hello there!"}`)), http.StatusOK, api)
		assert.Equal(t, "{}", string(responseBody))

		var task database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		assert.Equal(t, "Hello there!", (*task.Comments)[0].Body)
		assert.NotNil(t, (*task.Comments)[0].ExternalID)
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
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)
		responseBody := ServeRequest(t, authToken, "POST", "/tasks/"+insertedTaskID.Hex()+"/comments/add/", bytes.NewBuffer([]byte(`{"body": "Hello there!"}`)), http.StatusOK, api)
		assert.Equal(t, "{}", string(responseBody))

		var task database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		assert.Equal(t, "Hello there!", (*task.Comments)[1].Body)
	})
}
