package api

import (
	"bytes"
	"context"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"go.mongodb.org/mongo-driver/bson"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestEventDelete(t *testing.T) {
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
			IDExternal: "sample_calendar_id",
			SourceID:   external.TASK_SOURCE_ID_GCAL,
		},
		TaskType: database.TaskType{IsEvent: true},
	})
	assert.NoError(t, err)
	calendarTaskID := insertResult.InsertedID.(primitive.ObjectID)
	calendarTaskIDHex := calendarTaskID.Hex()

	calendarDeleteServer := testutils.GetMockAPIServer(t, 200, "[]")
	api := GetAPI()
	api.ExternalConfig.GoogleOverrideURLs.CalendarFetchURL = &calendarDeleteServer.URL
	router := GetRouter(api)

	//UnauthorizedTest(t, "DELETE", "/events/delete/"+calendarTaskIDHex+"/", nil)
	t.Run("InvalidHex", func(t *testing.T) {
		ServeRequest(t, authToken, "DELETE", "/events/delete/"+calendarTaskIDHex+"1/", nil, http.StatusNotFound)
	})

	t.Run("InvalidUser", func(t *testing.T) {
		secondAuthToken := login("tester@generaltask.com", "")
		ServeRequest(t, secondAuthToken, "DELETE", "/events/delete/"+calendarTaskIDHex+"1/", nil, http.StatusNotFound)
	})

	t.Run("MarkAsDoneSuccess", func(t *testing.T) {
		var task database.Item
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = taskCollection.FindOne(dbCtx, bson.M{"_id": calendarTaskID}).Decode(&task)
		assert.Equal(t, "sample_calendar_id", task.IDExternal)

		request, _ := http.NewRequest(
			"DELETE",
			"/events/delete/"+calendarTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		count, _ := taskCollection.CountDocuments(dbCtx, bson.M{"_id": calendarTaskID})
		assert.Equal(t, int64(0), count)
	})
}
