package api

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestTaskDetail(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	// parentCtx := context.Background()

	authToken := login("approved@generaltask.com", "General Tasker")
	userID := getUserIDFromAuthToken(t, db, authToken)
	notUserID := primitive.NewObjectID()

	_, err = database.GetOrCreateTask(
		db,
		userID,
		"123abc",
		"foobar_source",
		&database.Item{
			TaskBase: database.TaskBase{
				IDExternal: "123abc",
				SourceID:   "foobar_source",
				UserID:     userID,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		},
	)
	assert.NoError(t, err)
	_, err = database.GetOrCreateTask(
		db,
		userID,
		"123abcde",
		"foobar_source",
		&database.Item{
			TaskBase: database.TaskBase{
				IDExternal:  "123abcde",
				SourceID:    "foobar_source",
				UserID:      userID,
				IsCompleted: true,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		},
	)
	assert.NoError(t, err)
	_, err = database.GetOrCreateTask(
		db,
		userID,
		"123abd",
		"gmail",
		&database.Item{
			Email: database.Email{
				SenderDomain: "gmail",
			},
			TaskBase: database.TaskBase{
				IDExternal: "123abd",
				SourceID:   "gmail",
				UserID:     userID,
			},
			TaskType: database.TaskType{
				IsMessage: true,
			},
		},
	)
	assert.NoError(t, err)
	_, err = database.GetOrCreateTask(
		db,
		userID,
		"123abdef",
		"gmail",
		&database.Item{
			Email: database.Email{
				SenderDomain: "gmail",
			},
			TaskBase: database.TaskBase{
				IDExternal:  "123abdef",
				SourceID:    "gmail",
				UserID:      userID,
				IsCompleted: true,
			},
			TaskType: database.TaskType{
				IsMessage: true,
			},
		},
	)
	assert.NoError(t, err)
	nonUserTask, err := database.GetOrCreateTask(
		db,
		notUserID,
		"123abe",
		"foobar_source",
		&database.Item{
			TaskBase: database.TaskBase{
				IDExternal: "123abe",
				SourceID:   "foobar_source",
				UserID:     notUserID,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		},
	)
	assert.NoError(t, err)

	router := GetRouter(GetAPI())

	t.Run("InvalidTaskID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/tasks/details/%s/", primitive.NewObjectID()),
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
			fmt.Sprintf("/tasks/details/%s/", nonUserTask.ID),
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	// t.Run("MissingTitle", func(t *testing.T) {
	// 	request, _ := http.NewRequest(
	// 		"POST",
	// 		"/tasks/create/gt_task/",
	// 		nil)
	// 	request.Header.Add("Authorization", "Bearer "+authToken)
	// 	recorder := httptest.NewRecorder()
	// 	router.ServeHTTP(recorder, request)
	// 	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	// 	body, err := ioutil.ReadAll(recorder.Body)
	// 	assert.NoError(t, err)
	// 	assert.Equal(t, "{\"detail\":\"invalid or missing parameter.\"}", string(body))
	// })
	// t.Run("WrongAccountID", func(t *testing.T) {
	// 	// this currently isn't possible because only GT tasks are supported, but we should add this when it's possible
	// })
	// t.Run("BadTaskSection", func(t *testing.T) {
	// 	authToken = login("create_task_bad_task_section@generaltask.com", "")

	// 	request, _ := http.NewRequest(
	// 		"POST",
	// 		"/tasks/create/gt_task/",
	// 		bytes.NewBuffer([]byte(`{"title": "foobar", "id_task_section": "`+primitive.NewObjectID().Hex()+`"}`)))
	// 	request.Header.Add("Authorization", "Bearer "+authToken)
	// 	recorder := httptest.NewRecorder()
	// 	router.ServeHTTP(recorder, request)
	// 	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	// 	body, err := ioutil.ReadAll(recorder.Body)
	// 	assert.NoError(t, err)
	// 	assert.Equal(t, "{\"detail\":\"'id_task_section' is not a valid ID\"}", string(body))
	// })
	// t.Run("SuccessTitleOnly", func(t *testing.T) {
	// 	authToken = login("create_task_success_title_only@generaltask.com", "")
	// 	userID := getUserIDFromAuthToken(t, db, authToken)

	// 	request, _ := http.NewRequest(
	// 		"POST",
	// 		"/tasks/create/gt_task/",
	// 		bytes.NewBuffer([]byte(`{"title": "buy more dogecoin"}`)))
	// 	request.Header.Add("Authorization", "Bearer "+authToken)
	// 	recorder := httptest.NewRecorder()
	// 	router.ServeHTTP(recorder, request)
	// 	assert.Equal(t, http.StatusOK, recorder.Code)

	// 	tasks, err := database.GetActiveTasks(db, userID)
	// 	assert.NoError(t, err)
	// 	assert.Equal(t, 4, len(*tasks))
	// 	task := (*tasks)[3]
	// 	assert.Equal(t, "buy more dogecoin", task.Title)
	// 	assert.Equal(t, "", task.Body)
	// 	assert.Equal(t, external.GeneralTaskDefaultAccountID, task.SourceAccountID)
	// 	// 1 hour is the default
	// 	assert.Equal(t, int64(3600000000000), task.TimeAllocation)
	// 	assert.Equal(t, constants.IDTaskSectionToday, task.IDTaskSection)
	// })
	// t.Run("SuccessCustomSection", func(t *testing.T) {
	// 	authToken = login("create_task_success_custom_section@generaltask.com", "")
	// 	userID := getUserIDFromAuthToken(t, db, authToken)
	// 	sectionCollection := database.GetTaskSectionCollection(db)
	// 	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	// 	defer cancel()
	// 	res, err := sectionCollection.InsertOne(dbCtx, &database.TaskSection{UserID: userID, Name: "moooooon"})
	// 	assert.NoError(t, err)
	// 	customSectionID := res.InsertedID.(primitive.ObjectID)

	// 	request, _ := http.NewRequest(
	// 		"POST",
	// 		"/tasks/create/gt_task/",
	// 		bytes.NewBuffer([]byte(`{"title": "buy more dogecoin", "body": "seriously!", "due_date": "2020-12-09T16:09:53+00:00", "time_duration": 300, "id_task_section": "`+customSectionID.Hex()+`"}}`)))
	// 	request.Header.Add("Authorization", "Bearer "+authToken)
	// 	recorder := httptest.NewRecorder()
	// 	router.ServeHTTP(recorder, request)
	// 	assert.Equal(t, http.StatusOK, recorder.Code)

	// 	tasks, err := database.GetActiveTasks(db, userID)
	// 	assert.NoError(t, err)
	// 	assert.Equal(t, 4, len(*tasks))
	// 	task := (*tasks)[3]
	// 	assert.Equal(t, "buy more dogecoin", task.Title)
	// 	assert.Equal(t, "seriously!", task.Body)
	// 	assert.Equal(t, int64(300000000000), task.TimeAllocation)
	// 	assert.Equal(t, external.GeneralTaskDefaultAccountID, task.SourceAccountID)
	// 	assert.Equal(t, customSectionID, task.IDTaskSection)
	// })
}
