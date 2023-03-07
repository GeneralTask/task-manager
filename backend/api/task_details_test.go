package api

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestTaskDetail(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	testEmail := createRandomGTEmail()
	authToken := login(testEmail, "General Tasker")
	userID := getUserIDFromAuthToken(t, db, authToken)
	notUserID := primitive.NewObjectID()

	createdAt, _ := time.Parse(constants.YEAR_MONTH_DAY_FORMAT, "2019-04-20")
	updatedAt, _ := time.Parse(constants.YEAR_MONTH_DAY_FORMAT, "2019-04-29")
	completed := true
	linearTaskIDHex := insertTestTask(t, userID, database.Task{
		UserID:            userID,
		IDExternal:        "sample_linear_id_details",
		SourceID:          external.TASK_SOURCE_ID_LINEAR,
		IsCompleted:       &completed,
		CreatedAtExternal: primitive.NewDateTimeFromTime(createdAt),
		UpdatedAt:         primitive.NewDateTimeFromTime(updatedAt),
	})
	linearTaskIDHex2 := insertTestTask(t, userID, database.Task{
		UserID:      userID,
		IDExternal:  "sample_linear_id_details_2",
		SourceID:    external.TASK_SOURCE_ID_LINEAR,
		IsCompleted: &completed,
		Status: &database.ExternalTaskStatus{
			//ExternalID: "",
			State: "Done",
			Type:  "completed",
		},
	})
	nonUserTaskIDHex := insertTestTask(t, userID, database.Task{
		UserID:     notUserID,
		IDExternal: "sample_linear_id_details_3",
		SourceID:   external.TASK_SOURCE_ID_LINEAR,
	})

	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	UnauthorizedTest(t, "GET", fmt.Sprintf("/tasks/detail/%s/", linearTaskIDHex), nil)
	t.Run("InvalidTaskID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/tasks/detail/%s/", primitive.NewObjectID().Hex()),
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("TaskDoesNotBelongToUser", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/tasks/detail/%s/", nonUserTaskIDHex),
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/tasks/detail/%s/", linearTaskIDHex),
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)

		assert.Equal(t,
			fmt.Sprintf(`{"id":"%s","id_ordering":0,"id_folder":"000000000000000000000000","source":{"name":"Linear","logo":"linear"},"deeplink":"","title":"","body":"","due_date":"","priority_normalized":0,"is_done":true,"is_deleted":false,"recurring_task_template_id":"000000000000000000000000","created_at":"2019-04-20T00:00:00Z","updated_at":"2019-04-29T00:00:00Z","completed_at":"1970-01-01T00:00:00Z"}`, linearTaskIDHex),
			string(body))
	})
	t.Run("SuccessLinear", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/tasks/detail/%s/", linearTaskIDHex2),
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)

		assert.Equal(t,
			fmt.Sprintf(`{"id":"%s","id_ordering":0,"id_folder":"000000000000000000000000","source":{"name":"Linear","logo":"linear"},"deeplink":"","title":"","body":"","due_date":"","priority_normalized":0,"is_done":true,"is_deleted":false,"recurring_task_template_id":"000000000000000000000000","external_status":{"state":"Done","type":"completed"},"created_at":"1970-01-01T00:00:00Z","updated_at":"1970-01-01T00:00:00Z","completed_at":"1970-01-01T00:00:00Z"}`, linearTaskIDHex2),
			string(body))
	})
}

func insertTestTask(t *testing.T, userID primitive.ObjectID, task database.Task) string {
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
