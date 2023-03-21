package api

import (
	"context"
	"fmt"
	"net/http"
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

	UnauthorizedTest(t, "GET", fmt.Sprintf("/tasks/detail/%s/", linearTaskIDHex), nil)
	t.Run("InvalidTaskID", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "GET", fmt.Sprintf("/tasks/detail/%s/", primitive.NewObjectID().Hex()), nil, http.StatusNotFound, api)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(responseBody))
	})
	t.Run("TaskDoesNotBelongToUser", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "GET", fmt.Sprintf("/tasks/detail/%s/", nonUserTaskIDHex), nil, http.StatusNotFound, api)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(responseBody))
	})
	t.Run("Success", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "GET", fmt.Sprintf("/tasks/detail/%s/", linearTaskIDHex), nil, http.StatusOK, api)
		assert.Equal(t,
			fmt.Sprintf(`{"id":"%s","id_ordering":0,"id_folder":"000000000000000000000000","source":{"name":"Linear","logo":"linear"},"deeplink":"","title":"","body":"","due_date":"","priority_normalized":0,"is_done":true,"is_deleted":false,"recurring_task_template_id":"000000000000000000000000","created_at":"2019-04-20T00:00:00Z","updated_at":"2019-04-29T00:00:00Z","completed_at":"1970-01-01T00:00:00Z","deleted_at":"1970-01-01T00:00:00Z","shared_until":"1970-01-01T00:00:00Z"}`, linearTaskIDHex),
			string(responseBody))
	})
	t.Run("SuccessLinear", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "GET", fmt.Sprintf("/tasks/detail/%s/", linearTaskIDHex2), nil, http.StatusOK, api)
		assert.Equal(t,
			fmt.Sprintf(`{"id":"%s","id_ordering":0,"id_folder":"000000000000000000000000","source":{"name":"Linear","logo":"linear"},"deeplink":"","title":"","body":"","due_date":"","priority_normalized":0,"is_done":true,"is_deleted":false,"recurring_task_template_id":"000000000000000000000000","external_status":{"state":"Done","type":"completed"},"created_at":"1970-01-01T00:00:00Z","updated_at":"1970-01-01T00:00:00Z","completed_at":"1970-01-01T00:00:00Z","deleted_at":"1970-01-01T00:00:00Z","shared_until":"1970-01-01T00:00:00Z"}`, linearTaskIDHex2),
			string(responseBody))
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
