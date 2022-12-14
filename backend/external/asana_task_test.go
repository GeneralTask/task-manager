package external

import (
	"context"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/testutils"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	DefaultUserInfoResponse string = `{"data": {"workspaces": [{"gid": "6942069420"}]}}`
)

func TestLoadAsanaTasks(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	taskServerSuccess := testutils.GetMockAPIServer(t, 200, `{"data": [{"gid": "6942069420", "due_on": "2021-04-20", "html_notes": "hmm", "name": "Task!", "permalink_url": "https://example.com/"}]}`)
	userInfoServerSuccess := testutils.GetMockAPIServer(t, 200, `{"data": {"workspaces": [{"gid": "6942069420"}]}}`)

	t.Run("BadUserInfoStatusCode", func(t *testing.T) {
		userInfoServer := testutils.GetMockAPIServer(t, 400, "")
		defer userInfoServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{UserInfoURL: &userInfoServer.URL}}}
		userID := primitive.NewObjectID()

		var taskResult = make(chan TaskResult)
		go asanaTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, "bad status code: 400", result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("BadUserInfoResponse", func(t *testing.T) {
		userInfoServer := testutils.GetMockAPIServer(t, 200, `oopsie poopsie`)
		defer userInfoServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{UserInfoURL: &userInfoServer.URL}}}
		userID := primitive.NewObjectID()

		var taskResult = make(chan TaskResult)
		go asanaTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, "invalid character 'o' looking for beginning of value", result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("NoWorkspaceInUserInfo", func(t *testing.T) {
		userInfoServer := testutils.GetMockAPIServer(t, 200, `{"data": {"workspaces": []}}`)
		defer userInfoServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{UserInfoURL: &userInfoServer.URL}}}
		userID := primitive.NewObjectID()

		var taskResult = make(chan TaskResult)
		go asanaTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, "user has not workspaces", result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("BadTaskStatusCode", func(t *testing.T) {
		taskServer := testutils.GetMockAPIServer(t, 409, "")
		defer taskServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{
			TaskFetchURL: &taskServer.URL,
			UserInfoURL:  &userInfoServerSuccess.URL,
		}}}
		userID := primitive.NewObjectID()

		var taskResult = make(chan TaskResult)
		go asanaTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, "bad status code: 409", result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("BadTaskResponse", func(t *testing.T) {
		taskServer := testutils.GetMockAPIServer(t, 200, `to the moon`)
		defer taskServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{
			TaskFetchURL: &taskServer.URL,
			UserInfoURL:  &userInfoServerSuccess.URL,
		}}}
		userID := primitive.NewObjectID()

		var taskResult = make(chan TaskResult)
		go asanaTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, "invalid character 'o' in literal true (expecting 'r')", result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("Success", func(t *testing.T) {
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{
			TaskFetchURL: &taskServerSuccess.URL,
			UserInfoURL:  &userInfoServerSuccess.URL,
		}}}
		userID := primitive.NewObjectID()

		dueDate, _ := time.Parse("2006-01-02", "2021-04-20")
		dueDatePrim := primitive.NewDateTimeFromTime(dueDate)
		createdAt, _ := time.Parse("2006-01-02", "2019-04-20")
		title := "Task!"
		body := "hmm"
		expectedTask := database.Task{
			IDOrdering:        0,
			IDExternal:        "6942069420",
			IDTaskSection:     constants.IDTaskSectionDefault,
			Deeplink:          "https://example.com/",
			Title:             &title,
			Body:              &body,
			SourceID:          TASK_SOURCE_ID_ASANA,
			SourceAccountID:   "wrong",
			UserID:            userID,
			CreatedAtExternal: primitive.NewDateTimeFromTime(createdAt),
			DueDate:           &dueDatePrim,
		}

		var taskResult = make(chan TaskResult)
		go asanaTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.Tasks))
		assertTasksEqual(t, &expectedTask, result.Tasks[0])

		var taskFromDB database.Task
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err := taskCollection.FindOne(
			dbCtx,
			bson.M{"user_id": userID},
		).Decode(&taskFromDB)
		assert.NoError(t, err)
		assertTasksEqual(t, &expectedTask, &taskFromDB)
		assert.Equal(t, "sample_account@email.com", taskFromDB.SourceAccountID) // doesn't get updated
	})
	t.Run("SuccessExistingTask", func(t *testing.T) {
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{
			TaskFetchURL: &taskServerSuccess.URL,
			UserInfoURL:  &userInfoServerSuccess.URL,
		}}}
		userID := primitive.NewObjectID()

		dueDate, _ := time.Parse("2006-01-02", "2021-04-21")
		dueDatePrim := primitive.NewDateTimeFromTime(dueDate)
		createdAt, _ := time.Parse("2006-01-02", "2019-04-20")
		title := "Task wrong!"
		body := "different body"
		allocation := time.Hour.Nanoseconds()
		completed := true
		expectedTask := database.Task{
			IDOrdering:        0,
			IDExternal:        "6942069420",
			IDTaskSection:     constants.IDTaskSectionDefault,
			IsCompleted:       &completed,
			Deeplink:          "https://example.com/",
			Title:             &title,
			Body:              &body,
			SourceID:          TASK_SOURCE_ID_ASANA,
			SourceAccountID:   "sugapapa",
			UserID:            userID,
			CreatedAtExternal: primitive.NewDateTimeFromTime(createdAt),
			DueDate:           &dueDatePrim,
			TimeAllocation:    &allocation,
		}
		database.GetOrCreateTask(
			db,
			userID,
			"6942069420",
			TASK_SOURCE_ID_ASANA,
			&expectedTask,
		)
		// switch a few fields from their existing db value to their expected output value
		dueDateCorrect, _ := time.Parse("2006-01-02", "2021-04-20")
		dueDateCorrectPrim := primitive.NewDateTimeFromTime(dueDateCorrect)
		expectedTask.DueDate = &dueDateCorrectPrim

		correctTitle := "Task!"
		correctBody := "hmm"
		expectedTask.Title = &correctTitle
		expectedTask.Body = &correctBody

		var taskResult = make(chan TaskResult)
		go asanaTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.Tasks))
		assertTasksEqual(t, &expectedTask, result.Tasks[0])

		var taskFromDB database.Task
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err := taskCollection.FindOne(
			dbCtx,
			bson.M{"user_id": userID},
		).Decode(&taskFromDB)
		assert.NoError(t, err)
		assertTasksEqual(t, &expectedTask, &taskFromDB)
		assert.False(t, *taskFromDB.IsCompleted)
		assert.Equal(t, "sugapapa", taskFromDB.SourceAccountID) // doesn't get updated
	})
}

func TestModifyAsanaTask(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	t.Run("MarkAsDoneBadResponse", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 400, "")
		defer taskUpdateServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{TaskUpdateURL: &taskUpdateServer.URL}}}
		userID := primitive.NewObjectID()

		isCompleted := true
		err := asanaTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{IsCompleted: &isCompleted}, nil)
		assert.NotEqual(t, nil, err)
		assert.Equal(t, "bad status code: 400", err.Error())
	})
	t.Run("MarkAsDoneSuccess", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"foo": "bar"}`)
		defer taskUpdateServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{TaskUpdateURL: &taskUpdateServer.URL}}}
		userID := primitive.NewObjectID()

		isCompleted := true
		err := asanaTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{IsCompleted: &isCompleted}, nil)
		assert.NoError(t, err)
	})
	t.Run("MarkAsNotDoneSuccess", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"foo": "bar"}`)
		defer taskUpdateServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{TaskUpdateURL: &taskUpdateServer.URL}}}
		userID := primitive.NewObjectID()

		isCompleted := false
		err := asanaTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{IsCompleted: &isCompleted}, nil)
		assert.NoError(t, err)
	})
	t.Run("UpdateFieldsAndMarkAsDoneSuccess", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"foo": "bar"}`)
		defer taskUpdateServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{TaskUpdateURL: &taskUpdateServer.URL}}}
		userID := primitive.NewObjectID()

		newName := "New Title"
		newBody := "New Body"
		isCompleted := true
		dueDate := primitive.NewDateTimeFromTime(time.Now())

		err := asanaTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:       &newName,
			Body:        &newBody,
			DueDate:     &dueDate,
			IsCompleted: &isCompleted,
		}, nil)
		assert.NoError(t, err)
	})
	t.Run("UpdateFieldsAndMarkAsDoneBadResponse", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 400, "")
		defer taskUpdateServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{TaskUpdateURL: &taskUpdateServer.URL}}}
		userID := primitive.NewObjectID()

		newName := "New Title"
		newBody := "New Body"
		isCompleted := true
		dueDate := primitive.NewDateTimeFromTime(time.Now())

		err := asanaTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:       &newName,
			Body:        &newBody,
			DueDate:     &dueDate,
			IsCompleted: &isCompleted,
		}, nil)
		assert.NotEqual(t, nil, err)
		assert.Equal(t, "bad status code: 400", err.Error())
	})
	t.Run("UpdateTitleBodyDueDateSuccess", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"foo": "bar"}`)
		defer taskUpdateServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{TaskUpdateURL: &taskUpdateServer.URL}}}
		userID := primitive.NewObjectID()

		newName := "New Title"
		newBody := "New Body"
		dueDate := primitive.NewDateTimeFromTime(time.Now())

		err := asanaTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:   &newName,
			Body:    &newBody,
			DueDate: &dueDate,
		}, nil)
		assert.NoError(t, err)
	})
	t.Run("UpdateTitleBodyDueDateBadResponse", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 400, "")
		defer taskUpdateServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{TaskUpdateURL: &taskUpdateServer.URL}}}
		userID := primitive.NewObjectID()

		newName := "New Title"
		newBody := "New Body"
		dueDate := primitive.NewDateTimeFromTime(time.Now())

		err := asanaTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:   &newName,
			Body:    &newBody,
			DueDate: &dueDate,
		}, nil)
		assert.NotEqual(t, nil, err)
		assert.Equal(t, "bad status code: 400", err.Error())
	})
	t.Run("UpdateFieldsMarkAsNotDoneSuccess", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"foo": "bar"}`)
		defer taskUpdateServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{TaskUpdateURL: &taskUpdateServer.URL}}}
		userID := primitive.NewObjectID()

		newName := "New Title"
		newBody := "New Body"
		isCompleted := false
		dueDate := primitive.NewDateTimeFromTime(time.Now())

		err := asanaTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:       &newName,
			Body:        &newBody,
			DueDate:     &dueDate,
			IsCompleted: &isCompleted,
		}, nil)
		assert.NoError(t, err)
	})

	t.Run("UpdateFieldsMarkAsNotDoneBadResponse", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 400, "")
		defer taskUpdateServer.Close()
		asanaTask := AsanaTaskSource{Asana: AsanaService{ConfigValues: AsanaConfigValues{TaskUpdateURL: &taskUpdateServer.URL}}}
		userID := primitive.NewObjectID()

		newName := "New Title"
		newBody := "New Body"
		isCompleted := false
		dueDate := primitive.NewDateTimeFromTime(time.Now())

		err := asanaTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:       &newName,
			Body:        &newBody,
			DueDate:     &dueDate,
			IsCompleted: &isCompleted,
		}, nil)
		assert.NotEqual(t, nil, err)
		assert.Equal(t, "bad status code: 400", err.Error())
	})
	t.Run("GetTaskUpdateBodyNoDueDate", func(t *testing.T) {
		title := "Title"
		description := "Body"
		timeAllocation := int64(1000)
		isCompleted := true

		updateFields := &database.Task{
			Title:          &title,
			Body:           &description,
			TimeAllocation: &timeAllocation,
			IsCompleted:    &isCompleted,
		}
		expected := AsanaTasksUpdateBody{
			Data: AsanaTasksUpdateFields{
				Name:      &title,
				HTMLNotes: &description,
				Completed: &isCompleted,
			},
		}
		asanaTask := AsanaTaskSource{}
		body := asanaTask.GetTaskUpdateBody(updateFields)
		assert.Equal(t, expected, *body)
	})
	t.Run("GetTaskUpdateBodyWithDueDate", func(t *testing.T) {
		title := "Title"
		description := "Body"
		date := "2022-02-27T08:00:00Z"
		shortenedDate := "2022-02-27"
		dueDate, _ := time.Parse(time.RFC3339, date)
		dueDatePrim := primitive.NewDateTimeFromTime(dueDate)
		timeAllocation := int64(1000)
		isCompleted := true

		updateFields := &database.Task{
			Title:          &title,
			Body:           &description,
			DueDate:        &dueDatePrim,
			TimeAllocation: &timeAllocation,
			IsCompleted:    &isCompleted,
		}
		expected := AsanaTasksUpdateBody{
			Data: AsanaTasksUpdateFields{
				Name:      &title,
				HTMLNotes: &description,
				DueOn:     &shortenedDate,
				Completed: &isCompleted,
			},
		}
		asanaTask := AsanaTaskSource{}
		body := asanaTask.GetTaskUpdateBody(updateFields)
		assert.Equal(t, *expected.Data.DueOn, *body.Data.DueOn)
		assert.Equal(t, expected, *body)
	})
	t.Run("GetTaskUpdateBodyEmpty", func(t *testing.T) {
		updateFields := &database.Task{}
		expected := AsanaTasksUpdateBody{
			Data: AsanaTasksUpdateFields{},
		}
		asanaTask := AsanaTaskSource{}
		body := asanaTask.GetTaskUpdateBody(updateFields)
		assert.Equal(t, expected, *body)
	})
}
