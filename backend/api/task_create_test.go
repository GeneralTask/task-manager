package api

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
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

	authToken := login("approved@generaltask.com", "")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	t.Run("BadSourceID", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "POST", "/tasks/create/dogecoin/", nil, http.StatusNotFound, api)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(responseBody))
	})
	t.Run("UnsupportedSourceID", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "POST", "/tasks/create/gmail/", nil, http.StatusNotFound, api)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(responseBody))
	})
	t.Run("MissingTitle", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", nil, http.StatusBadRequest, api)
		assert.Equal(t, "{\"detail\":\"invalid or missing parameter\"}", string(responseBody))
	})
	t.Run("WrongAccountID", func(t *testing.T) {
		// this currently isn't possible because only GT tasks are supported, but we should add this when it's possible
	})
	t.Run("BadTaskSection", func(t *testing.T) {
		authToken = login("create_task_bad_task_section@generaltask.com", "")
		responseBody := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", bytes.NewBuffer([]byte(`{"title": "foobar", "id_task_section": "`+primitive.NewObjectID().Hex()+`"}`)), http.StatusBadRequest, api)
		assert.Equal(t, "{\"detail\":\"'id_task_section' is not a valid ID\"}", string(responseBody))
	})
	t.Run("BadParentTaskID", func(t *testing.T) {
		authToken = login("create_task_bad_task_id@generaltask.com", "")
		responseBody := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", bytes.NewBuffer([]byte(`{"title": "foobar", "parent_task_id": "bad value"}`)), http.StatusBadRequest, api)
		assert.Equal(t, "{\"detail\":\"'parent_task_id' is not a valid ID\"}", string(responseBody))
	})
	t.Run("NoParentTaskInDB", func(t *testing.T) {
		authToken = login("no_parent_task_in_db@generaltask.com", "")
		parentTaskID := primitive.NewObjectID()
		responseBody := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", bytes.NewBuffer([]byte(`{"title": "foobar", "parent_task_id": "`+parentTaskID.Hex()+`"}`)), http.StatusBadRequest, api)
		assert.Equal(t, "{\"detail\":\"'parent_task_id' is not a valid ID\"}", string(responseBody))
	})
	t.Run("WrongUserIDForParent", func(t *testing.T) {
		authToken = login("wrong_user_id_for_parent@generaltask.com", "")
		taskCollection := database.GetTaskCollection(db)
		title := "title"
		completed := true
		res, err := taskCollection.InsertOne(context.Background(), &database.Task{UserID: primitive.NewObjectID(), Title: &title, IsCompleted: &completed})
		assert.NoError(t, err)
		parentTaskID := res.InsertedID.(primitive.ObjectID)
		responseBody := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", bytes.NewBuffer([]byte(`{"title": "buy more dogecoin", "body": "seriously!", "due_date": "2020-12-09T16:09:53+00:00", "time_duration": 300, "parent_task_id": "`+parentTaskID.Hex()+`"}`)), http.StatusBadRequest, api)
		assert.Equal(t, "{\"detail\":\"'parent_task_id' is not a valid ID\"}", string(responseBody))
	})
	t.Run("SuccessTitleOnly", func(t *testing.T) {
		authToken = login("create_task_success_title_only@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		body := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", bytes.NewBuffer([]byte(`{"title": "buy more dogecoin"}`)), http.StatusOK, nil)

		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 6, len(*tasks))
		task := (*tasks)[5]
		assert.Equal(t, "buy more dogecoin", *task.Title)
		assert.Equal(t, "", *task.Body)
		assert.Equal(t, external.GeneralTaskDefaultAccountID, task.SourceAccountID)
		// 1 hour is the default
		assert.Equal(t, int64(3600000000000), *task.TimeAllocation)
		assert.Equal(t, constants.IDTaskSectionDefault, task.IDTaskSection)
		assert.Equal(t, constants.DefaultTaskIDOrdering, task.IDOrdering)
		assert.Equal(t, fmt.Sprintf("{\"task_id\":\"%s\"}", task.ID.Hex()), string(body))
	})
	t.Run("SuccessReordering", func(t *testing.T) {
		// use same auth token as above to reuse task
		authToken = login("create_task_success_title_only@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", bytes.NewBuffer([]byte(`{"title": "buy more dogecoin AGAIN"}`)), http.StatusOK, nil)

		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 7, len(*tasks))
		task1 := (*tasks)[5]
		assert.Equal(t, "buy more dogecoin", *task1.Title)
		assert.Equal(t, 2, task1.IDOrdering)
		task2 := (*tasks)[6]
		assert.Equal(t, "buy more dogecoin AGAIN", *task2.Title)
		assert.Equal(t, constants.DefaultTaskIDOrdering, task2.IDOrdering)
	})
	t.Run("SuccessAssignToOtherUser", func(t *testing.T) {
		authToken = login("assign_to_other_user@generaltask.com", "")

		userCollection := database.GetUserCollection(db)
		assert.NoError(t, err)
		johnUser, err := userCollection.InsertOne(context.Background(), database.User{
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
		assert.Equal(t, constants.DefaultTaskIDOrdering, task.IDOrdering)
		assert.Equal(t, fmt.Sprintf("{\"task_id\":\"%s\"}", task.ID.Hex()), string(body))
		assert.Equal(t, task.UserID, johnUser.InsertedID.(primitive.ObjectID))
	})
	t.Run("SuccessCustomSection", func(t *testing.T) {
		authToken = login("create_task_success_custom_section@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)
		sectionCollection := database.GetTaskSectionCollection(db)
		res, err := sectionCollection.InsertOne(context.Background(), &database.TaskSection{UserID: userID, Name: "moooooon"})
		assert.NoError(t, err)
		customSectionID := res.InsertedID.(primitive.ObjectID)

		body := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", bytes.NewBuffer([]byte(`{"title": "buy more dogecoin", "body": "seriously!", "due_date": "2020-12-09T16:09:53+00:00", "time_duration": 300, "id_task_section": "`+customSectionID.Hex()+`"}`)), http.StatusOK, nil)

		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 6, len(*tasks))
		task := (*tasks)[5]
		assert.Equal(t, "buy more dogecoin", *task.Title)
		assert.Equal(t, "seriously!", *task.Body)
		assert.Equal(t, int64(300000000000), *task.TimeAllocation)
		assert.Equal(t, external.GeneralTaskDefaultAccountID, task.SourceAccountID)
		assert.Equal(t, customSectionID, task.IDTaskSection)
		assert.Equal(t, constants.DefaultTaskIDOrdering, task.IDOrdering)
		assert.Equal(t, fmt.Sprintf("{\"task_id\":\"%s\"}", task.ID.Hex()), string(body))
	})
	t.Run("SuccessSubTask", func(t *testing.T) {
		authToken = login("create_sub_task@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)
		taskCollection := database.GetTaskCollection(db)
		title := "title"
		completed := true
		res, err := taskCollection.InsertOne(context.Background(), &database.Task{UserID: userID, Title: &title, IsCompleted: &completed})
		assert.NoError(t, err)
		parentTaskID := res.InsertedID.(primitive.ObjectID)

		body := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", bytes.NewBuffer([]byte(`{"title": "buy more dogecoin", "body": "seriously!", "due_date": "2020-12-09T16:09:53+00:00", "time_duration": 300, "parent_task_id": "`+parentTaskID.Hex()+`"}`)), http.StatusOK, nil)

		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 6, len(*tasks))
		task := (*tasks)[5]
		assert.Equal(t, "buy more dogecoin", *task.Title)
		assert.Equal(t, "seriously!", *task.Body)
		assert.Equal(t, int64(300000000000), *task.TimeAllocation)
		assert.Equal(t, external.GeneralTaskDefaultAccountID, task.SourceAccountID)
		assert.Equal(t, parentTaskID, task.ParentTaskID)
		assert.Equal(t, fmt.Sprintf("{\"task_id\":\"%s\"}", task.ID.Hex()), string(body))
	})
}
