package api

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestCreateTask(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	parentCtx := context.Background()

	authToken := login("approved@generaltask.com", "")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	t.Run("BadSourceID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/tasks/create/dogecoin/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("UnsupportedSourceID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/tasks/create/gmail/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("MissingTitle", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/tasks/create/gt_task/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing parameter\"}", string(body))
	})
	t.Run("WrongAccountID", func(t *testing.T) {
		// this currently isn't possible because only GT tasks are supported, but we should add this when it's possible
	})
	t.Run("BadTaskSection", func(t *testing.T) {
		authToken = login("create_task_bad_task_section@generaltask.com", "")

		request, _ := http.NewRequest(
			"POST",
			"/tasks/create/gt_task/",
			bytes.NewBuffer([]byte(`{"title": "foobar", "id_task_section": "`+primitive.NewObjectID().Hex()+`"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"'id_task_section' is not a valid ID\"}", string(body))
	})
	t.Run("SuccessTitleOnly", func(t *testing.T) {
		authToken = login("create_task_success_title_only@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		body := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", bytes.NewBuffer([]byte(`{"title": "buy more dogecoin"}`)), http.StatusOK, nil)

		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 4, len(*tasks))
		task := (*tasks)[3]
		assert.Equal(t, "buy more dogecoin", *task.Title)
		assert.Equal(t, "", *task.Body)
		assert.Equal(t, external.GeneralTaskDefaultAccountID, task.SourceAccountID)
		// 1 hour is the default
		assert.Equal(t, int64(3600000000000), *task.TimeAllocation)
		assert.Equal(t, constants.IDTaskSectionDefault, task.IDTaskSection)
		assert.Equal(t, fmt.Sprintf("{\"task_id\":\"%s\"}", task.ID.Hex()), string(body))
	})
	t.Run("SuccessAssignToOtherUser", func(t *testing.T) {
		authToken = login("assign_to_other_user@generaltask.com", "")

		ctx := context.Background()
		userCollection := database.GetUserCollection(db)
		assert.NoError(t, err)
		johnUser, err := userCollection.InsertOne(ctx, database.User{
			Email: "john@generaltask.com",
		})
		assert.NoError(t, err)

		body := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", bytes.NewBuffer([]byte(`{"title": "<to john>buy more dogecoin"}`)), http.StatusOK, nil)

		tasks, err := database.GetActiveTasks(db, johnUser.InsertedID.(primitive.ObjectID))
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		task := (*tasks)[0]
		assert.Equal(t, "buy more dogecoin from: assign_to_other_user@generaltask.com", *task.Title)
		assert.Equal(t, "", *task.Body)
		assert.Equal(t, external.GeneralTaskDefaultAccountID, task.SourceAccountID)
		// 1 hour is the default
		assert.Equal(t, int64(3600000000000), *task.TimeAllocation)
		assert.Equal(t, constants.IDTaskSectionDefault, task.IDTaskSection)
		assert.Equal(t, fmt.Sprintf("{\"task_id\":\"%s\"}", task.ID.Hex()), string(body))
		assert.Equal(t, task.UserID, johnUser.InsertedID.(primitive.ObjectID))
	})
	t.Run("SuccessCustomSection", func(t *testing.T) {
		authToken = login("create_task_success_custom_section@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)
		sectionCollection := database.GetTaskSectionCollection(db)
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		res, err := sectionCollection.InsertOne(dbCtx, &database.TaskSection{UserID: userID, Name: "moooooon"})
		assert.NoError(t, err)
		customSectionID := res.InsertedID.(primitive.ObjectID)

		body := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", bytes.NewBuffer([]byte(`{"title": "buy more dogecoin", "body": "seriously!", "due_date": "2020-12-09T16:09:53+00:00", "time_duration": 300, "id_task_section": "`+customSectionID.Hex()+`"}`)), http.StatusOK, nil)

		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 4, len(*tasks))
		task := (*tasks)[3]
		assert.Equal(t, "buy more dogecoin", *task.Title)
		assert.Equal(t, "seriously!", *task.Body)
		assert.Equal(t, int64(300000000000), *task.TimeAllocation)
		assert.Equal(t, external.GeneralTaskDefaultAccountID, task.SourceAccountID)
		assert.Equal(t, customSectionID, task.IDTaskSection)
		assert.Equal(t, fmt.Sprintf("{\"task_id\":\"%s\"}", task.ID.Hex()), string(body))
	})
}
