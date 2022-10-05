package database

import (
	"context"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestGetTasks(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	notUserID := primitive.NewObjectID()
	notCompleted := false
	task1, err := GetOrCreateTask(
		db,
		userID,
		"123abc",
		"foobar_source",
		&Task{
			IDExternal:  "123abc",
			SourceID:    "foobar_source",
			UserID:      userID,
			IsCompleted: &notCompleted,
		},
	)
	assert.NoError(t, err)
	completed := true
	task2, err := GetOrCreateTask(
		db,
		userID,
		"123abcde",
		"foobar_source",
		&Task{
			IDExternal:  "123abcde",
			SourceID:    "foobar_source",
			UserID:      userID,
			IsCompleted: &completed,
		},
	)
	assert.NoError(t, err)
	_, err = GetOrCreateTask(
		db,
		notUserID,
		"123abe",
		"foobar_source",
		&Task{
			IDExternal:  "123abe",
			SourceID:    "foobar_source",
			UserID:      notUserID,
			IsCompleted: &notCompleted,
		},
	)
	assert.NoError(t, err)

	t.Run("GetActiveTasks", func(t *testing.T) {
		tasks, err := GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		assert.Equal(t, task1.ID, (*tasks)[0].ID)
	})
	t.Run("GetCompletedTasks", func(t *testing.T) {
		tasks, err := GetCompletedTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		assert.Equal(t, task2.ID, (*tasks)[0].ID)
	})
	t.Run("GetTasks", func(t *testing.T) {
		tasks, err := GetTasks(db, userID, nil, nil)
		assert.NoError(t, err)
		assert.Equal(t, 2, len(*tasks))
		assert.Equal(t, task1.ID, (*tasks)[0].ID)
		assert.Equal(t, task2.ID, (*tasks)[1].ID)
	})
}

func TestGetDeletedTasks(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	notUserID := primitive.NewObjectID()
	notDeleted := false
	deleted := true
	task2, err := GetOrCreateTask(
		db,
		userID,
		"123abcde",
		"foobar_source",
		&Task{
			IDExternal: "123abcde",
			SourceID:   "foobar_source",
			UserID:     userID,
			IsDeleted:  &deleted,
		},
	)
	assert.NoError(t, err)
	_, err = GetOrCreateTask(
		db,
		notUserID,
		"123abe",
		"foobar_source",
		&Task{
			IDExternal: "123abe",
			SourceID:   "foobar_source",
			UserID:     notUserID,
			IsDeleted:  &notDeleted,
		},
	)
	assert.NoError(t, err)

	t.Run("Success", func(t *testing.T) {
		tasks, err := GetDeletedTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		assert.Equal(t, task2.ID, (*tasks)[0].ID)

	})
}

func TestGetMeetingPreparationTasks(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	notUserID := primitive.NewObjectID()
	notCompleted := false
	validMeetingPrepTask, err := GetOrCreateTask(
		db,
		userID,
		"123abc",
		"foobar_source",
		&Task{
			IDExternal:               "123abc",
			SourceID:                 "foobar_source",
			UserID:                   userID,
			IsCompleted:              &notCompleted,
			IsMeetingPreparationTask: true,
		},
	)
	assert.NoError(t, err)
	// Not meeting preparation task
	_, err = GetOrCreateTask(
		db,
		userID,
		"123abcde",
		"foobar_source",
		&Task{
			IDExternal:               "123abcde",
			SourceID:                 "foobar_source",
			UserID:                   userID,
			IsCompleted:              &notCompleted,
			IsMeetingPreparationTask: false,
		},
	)
	assert.NoError(t, err)
	// Completed meeting preparation task
	completed := true
	_, err = GetOrCreateTask(
		db,
		userID,
		"123abcdef",
		"foobar_source",
		&Task{
			IDExternal:               "123abcdef",
			SourceID:                 "foobar_source",
			UserID:                   userID,
			IsCompleted:              &completed,
			IsMeetingPreparationTask: true,
		},
	)
	assert.NoError(t, err)
	// Wrong user ID
	_, err = GetOrCreateTask(
		db,
		notUserID,
		"123abe",
		"foobar_source",
		&Task{
			IDExternal:               "123abe",
			SourceID:                 "foobar_source",
			UserID:                   notUserID,
			IsCompleted:              &notCompleted,
			IsMeetingPreparationTask: true,
		},
	)
	assert.NoError(t, err)
	t.Run("Success", func(t *testing.T) {
		tasks, err := GetMeetingPreparationTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		assert.Equal(t, validMeetingPrepTask.ID, (*tasks)[0].ID)
	})
}

func TestGetPullRequests(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	notUserID := primitive.NewObjectID()
	notCompleted := false
	pr1, err := GetOrCreatePullRequest(
		db,
		userID,
		"123abc",
		"foobar_source",
		&PullRequest{
			IDExternal:  "123abc",
			SourceID:    "foobar_source",
			UserID:      userID,
			IsCompleted: &notCompleted,
		},
	)
	assert.NoError(t, err)
	completed := true
	pr2, err := GetOrCreatePullRequest(
		db,
		userID,
		"123abcde",
		"foobar_source",
		&PullRequest{
			IDExternal:  "123abcde",
			SourceID:    "foobar_source",
			UserID:      userID,
			IsCompleted: &completed,
		},
	)
	assert.NoError(t, err)
	_, err = GetOrCreatePullRequest(
		db,
		notUserID,
		"123abe",
		"foobar_source",
		&PullRequest{
			IDExternal:  "123abe",
			SourceID:    "foobar_source",
			UserID:      notUserID,
			IsCompleted: &notCompleted,
		},
	)
	assert.NoError(t, err)

	t.Run("GetActivePRs", func(t *testing.T) {
		prs, err := GetActivePRs(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*prs))
		assert.Equal(t, pr1.ID, (*prs)[0].ID)
	})
	t.Run("GetPullRequests", func(t *testing.T) {
		prs, err := GetPullRequests(db, userID, nil)
		assert.NoError(t, err)
		assert.Equal(t, 2, len(*prs))
		assert.Equal(t, pr1.ID, (*prs)[0].ID)
		assert.Equal(t, pr2.ID, (*prs)[1].ID)
	})
}

func TestUpdateOrCreateTask(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	notCompleted := false
	task1, err := GetOrCreateTask(
		db,
		userID,
		"123abc",
		"foobar_source",
		&Task{
			IDExternal:  "123abc",
			SourceID:    "foobar_source",
			UserID:      userID,
			IsCompleted: &notCompleted,
		},
	)
	assert.NoError(t, err)

	t.Run("NoUpdateIfTaskExistsAndFieldsInUpdateIfMissing", func(t *testing.T) {
		completed := true
		updateTask := Task{
			IsCompleted: &completed,
		}

		title := "hello!"
		updateTask2 := Task{
			Title: &title,
		}

		newTask, err := UpdateOrCreateTask(db, userID, task1.IDExternal, task1.SourceID, updateTask, updateTask2, nil)
		assert.NoError(t, err)
		assert.Equal(t, task1.ID, newTask.ID)
		assert.Equal(t, *updateTask2.Title, *newTask.Title)
		assert.False(t, *newTask.IsCompleted)
	})
	t.Run("Success", func(t *testing.T) {
		completed := true
		updateTask := Task{
			IsCompleted: &completed,
		}

		newTask, err := UpdateOrCreateTask(db, userID, task1.IDExternal, task1.SourceID, nil, updateTask, nil)
		assert.NoError(t, err)
		assert.Equal(t, task1.ID, newTask.ID)
		assert.True(t, *newTask.IsCompleted)
	})
}

func TestUpdateOrCreatePullRequest(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	notCompleted := false
	pr1, err := GetOrCreatePullRequest(
		db,
		userID,
		"123abc",
		"foobar_source",
		&PullRequest{
			IDExternal:  "123abc",
			SourceID:    "foobar_source",
			UserID:      userID,
			IsCompleted: &notCompleted,
		},
	)
	assert.NoError(t, err)

	t.Run("CreateSuccess", func(t *testing.T) {
		newUserID := primitive.NewObjectID()
		newPR, err := UpdateOrCreatePullRequest(db, newUserID, "222aaa", "random_source", &PullRequest{
			IDExternal: "222aaa",
			SourceID:   "random_source",
			UserID:     newUserID,
			Title:      "new event",
		}, nil)
		assert.NoError(t, err)

		respPR, err := GetPullRequestByExternalID(db, "222aaa", newUserID)
		assert.NoError(t, err)
		assert.Equal(t, newPR.ID, respPR.ID)
		assert.Equal(t, "new event", respPR.Title)
	})
	t.Run("UpdateSuccess", func(t *testing.T) {
		completed := true
		updateTask := Task{
			IsCompleted: &completed,
		}

		newPR, err := UpdateOrCreatePullRequest(db, userID, pr1.IDExternal, pr1.SourceID, updateTask, nil)
		assert.NoError(t, err)
		assert.Equal(t, pr1.ID, newPR.ID)
		assert.True(t, *newPR.IsCompleted)
	})
}

func TestUpdateOrCreateCalendarEvent(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	event, err := GetOrCreateCalendarEvent(
		db,
		userID,
		"123abc",
		"foobar_source",
		&CalendarEvent{
			IDExternal: "123abc",
			SourceID:   "foobar_source",
			UserID:     userID,
			Title:      "example event",
		},
	)
	assert.NoError(t, err)

	t.Run("CreateSuccess", func(t *testing.T) {
		newUserID := primitive.NewObjectID()
		newEvent, err := UpdateOrCreateCalendarEvent(db, newUserID, "222aaa", "random_source", &CalendarEvent{
			IDExternal: "222aaa",
			SourceID:   "random_source",
			UserID:     newUserID,
			Title:      "new event",
		}, nil)
		assert.NoError(t, err)

		respEvent, err := GetCalendarEvent(db, (*newEvent).ID, newUserID)
		assert.NoError(t, err)
		assert.Equal(t, newEvent.ID, respEvent.ID)
		assert.Equal(t, "new event", respEvent.Title)
	})
	t.Run("UpdateSuccess", func(t *testing.T) {
		updateEvent := CalendarEvent{
			Title: "new title",
		}

		newPR, err := UpdateOrCreateCalendarEvent(db, userID, event.IDExternal, event.SourceID, updateEvent, nil)
		assert.NoError(t, err)
		assert.Equal(t, event.ID, newPR.ID)
		assert.Equal(t, updateEvent.Title, newPR.Title)
	})
}

func TestGetTask(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	notCompleted := false
	task1, err := GetOrCreateTask(
		db,
		userID,
		"123abc",
		"foobar_source",
		&Task{
			IDExternal:  "123abc",
			SourceID:    "foobar_source",
			UserID:      userID,
			IsCompleted: &notCompleted,
		},
	)
	assert.NoError(t, err)

	t.Run("WrongID", func(t *testing.T) {
		respTask, err := GetTask(db, primitive.NewObjectID(), userID)
		assert.Equal(t, mongo.ErrNoDocuments, err)
		assert.Nil(t, respTask)
	})
	t.Run("WrongUserID", func(t *testing.T) {
		respTask, err := GetTask(db, task1.ID, primitive.NewObjectID())
		assert.Equal(t, mongo.ErrNoDocuments, err)
		assert.Nil(t, respTask)
	})
	t.Run("Success", func(t *testing.T) {
		respTask, err := GetTask(db, task1.ID, userID)
		assert.NoError(t, err)
		assert.Equal(t, task1.ID, respTask.ID)
	})
}

func TestGetCalendarEvent(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	event, err := GetOrCreateCalendarEvent(
		db,
		userID,
		"123abc",
		"foobar_source",
		&CalendarEvent{
			IDExternal: "123abc",
			SourceID:   "foobar_source",
			UserID:     userID,
		},
	)
	assert.NoError(t, err)

	t.Run("WrongID", func(t *testing.T) {
		respEvent, err := GetCalendarEvent(db, primitive.NewObjectID(), userID)
		assert.Equal(t, mongo.ErrNoDocuments, err)
		assert.Nil(t, respEvent)
	})
	t.Run("WrongUserID", func(t *testing.T) {
		respEvent, err := GetCalendarEvent(db, event.ID, primitive.NewObjectID())
		assert.Equal(t, mongo.ErrNoDocuments, err)
		assert.Nil(t, respEvent)
	})
	t.Run("Success", func(t *testing.T) {
		respEvent, err := GetCalendarEvent(db, event.ID, userID)
		assert.NoError(t, err)
		assert.Equal(t, event.ID, respEvent.ID)
	})
}

func TestGetPullRequestByExternalID(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	pullRequest, err := GetOrCreatePullRequest(
		db,
		userID,
		"123abc",
		"foobar_source",
		&PullRequest{
			IDExternal: "123abc",
			SourceID:   "foobar_source",
			UserID:     userID,
		},
	)
	assert.NoError(t, err)

	t.Run("WrongID", func(t *testing.T) {
		respPR, err := GetPullRequestByExternalID(db, "wrong ID", userID)
		assert.Equal(t, mongo.ErrNoDocuments, err)
		assert.Nil(t, respPR)
	})
	t.Run("WrongUserID", func(t *testing.T) {
		respPR, err := GetPullRequestByExternalID(db, pullRequest.IDExternal, primitive.NewObjectID())
		assert.Equal(t, mongo.ErrNoDocuments, err)
		assert.Nil(t, respPR)
	})
	t.Run("Success", func(t *testing.T) {
		respPR, err := GetPullRequestByExternalID(db, pullRequest.IDExternal, userID)
		assert.NoError(t, err)
		assert.Equal(t, pullRequest.ID, respPR.ID)
	})
}

func TestMarkItemComplete(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	task1, err := GetOrCreateTask(
		db,
		userID,
		"123abc",
		"foobar_source",
		&Task{
			IDExternal: "123abc",
			SourceID:   "foobar_source",
			UserID:     userID,
		},
	)
	assert.NoError(t, err)
	t.Run("SuccessIdempotent", func(t *testing.T) {
		MarkCompleteWithCollection(GetTaskCollection(db), task1.ID)
		tasks, err := GetCompletedTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		updatedTask := (*tasks)[0]
		assert.True(t, *updatedTask.IsCompleted)
		assert.NotEqual(t, task1.CompletedAt, updatedTask.CompletedAt)

		// ensure timestamp advances enough to be different
		time.Sleep(time.Millisecond)

		MarkCompleteWithCollection(GetTaskCollection(db), task1.ID)
		tasks, err = GetCompletedTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		updatedTask2 := (*tasks)[0]
		assert.True(t, *updatedTask2.IsCompleted)
		assert.NotEqual(t, updatedTask.CompletedAt, updatedTask2.CompletedAt)
	})
}

func TestGetEventsUntilEndOfDay(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	notUserID := primitive.NewObjectID()
	timeBase := time.Date(2022, 1, 1, 0, 0, 0, 0, time.UTC)
	timeHourLater := time.Date(2022, 1, 1, 1, 0, 0, 0, time.UTC)
	timeDayLater := time.Date(2022, 1, 2, 0, 0, 0, 0, time.UTC)

	eventID, err := createTestCalendarEvent(db, userID, primitive.NewDateTimeFromTime(timeHourLater))
	assert.NoError(t, err)
	// Event create a day later should not be in the result
	_, err = createTestCalendarEvent(db, userID, primitive.NewDateTimeFromTime(timeDayLater))
	assert.NoError(t, err)
	// Incorrect UserID
	_, err = createTestCalendarEvent(db, notUserID, primitive.NewDateTimeFromTime(timeHourLater))
	assert.NoError(t, err)

	t.Run("Success", func(t *testing.T) {
		events, err := GetEventsUntilEndOfDay(db, userID, timeBase)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*events))
		assert.Equal(t, eventID, (*events)[0].ID)
	})
}

func TestTaskSectionName(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()

	t.Run("DefaultTaskSection", func(t *testing.T) {
		name, err := GetTaskSectionName(db, constants.IDTaskSectionDefault, userID)
		assert.NoError(t, err)
		assert.Equal(t, "Task Inbox", name)
	})
	t.Run("CustomTaskSection", func(t *testing.T) {
		sectionName := "TestSection"
		taskSectionCollection := GetTaskSectionCollection(db)

		res, err := taskSectionCollection.InsertOne(
			context.Background(),
			&TaskSection{
				UserID: userID,
				Name:   sectionName,
			},
		)
		assert.NoError(t, err)

		name, err := GetTaskSectionName(db, res.InsertedID.(primitive.ObjectID), userID)
		assert.NoError(t, err)
		assert.Equal(t, sectionName, name)
	})
	t.Run("NoTaskSectionWithProvidedID", func(t *testing.T) {
		db, dbCleanup, err := GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		name, err := GetTaskSectionName(db, primitive.NewObjectID(), userID)
		assert.Error(t, err)
		assert.Equal(t, "", name)
	})
}

func TestGetView(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()

	t.Run("ViewDoesNotExist", func(t *testing.T) {
		viewID := primitive.NewObjectID()
		_, err := GetView(db, userID, viewID)
		assert.Error(t, err)
		assert.Equal(t, mongo.ErrNoDocuments, err)
	})
	t.Run("WrongUserID", func(t *testing.T) {
		viewCollection := GetViewCollection(db)
		mongoResult, err := viewCollection.InsertOne(context.Background(), View{
			UserID: primitive.NewObjectID(),
		})
		assert.NoError(t, err)
		viewID := mongoResult.InsertedID.(primitive.ObjectID)

		_, err = GetView(db, userID, viewID)
		assert.Error(t, err)
		assert.Equal(t, mongo.ErrNoDocuments, err)
	})
	t.Run("Success", func(t *testing.T) {
		viewCollection := GetViewCollection(db)
		mongoResult, err := viewCollection.InsertOne(context.Background(), View{
			UserID: userID,
			Type:   "custom type",
		})
		assert.NoError(t, err)
		viewID := mongoResult.InsertedID.(primitive.ObjectID)

		view, err := GetView(db, userID, viewID)
		assert.NoError(t, err)
		assert.Equal(t, "custom type", view.Type)
	})
}

func TestGetTaskSections(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()

	t.Run("NoTaskSections", func(t *testing.T) {
		sections, err := GetTaskSections(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 0, len(*sections))
	})
	t.Run("CustomTaskSection", func(t *testing.T) {
		sectionName := "TestSection"
		taskSectionCollection := GetTaskSectionCollection(db)

		_, err := taskSectionCollection.InsertOne(
			context.Background(),
			&TaskSection{
				UserID: userID,
				Name:   sectionName,
			},
		)
		assert.NoError(t, err)

		sections, err := GetTaskSections(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*sections))
		assert.Equal(t, sectionName, (*sections)[0].Name)
	})
	t.Run("WrongUserID", func(t *testing.T) {
		sectionName := "TestSection"
		taskSectionCollection := GetTaskSectionCollection(db)

		_, err := taskSectionCollection.InsertOne(
			context.Background(),
			&TaskSection{
				UserID: userID,
				Name:   sectionName,
			},
		)
		assert.NoError(t, err)

		sections, err := GetTaskSections(db, primitive.NewObjectID())
		assert.NoError(t, err)
		assert.Equal(t, 0, len(*sections))
	})
}

func TestGetUser(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	googleID := "example@generaltask.com"
	name := "Tony the Tiger"

	_, err = GetUserCollection(db).InsertOne(
		context.Background(),
		&User{
			ID:       userID,
			GoogleID: googleID,
			Name:     name,
		},
	)
	assert.NoError(t, err)

	t.Run("WrongUserID", func(t *testing.T) {
		_, err := GetUser(db, primitive.NewObjectID())
		assert.Equal(t, mongo.ErrNoDocuments, err)
	})
	t.Run("Success", func(t *testing.T) {
		user, err := GetUser(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, googleID, user.GoogleID)
		assert.Equal(t, name, user.Name)
	})
}

func TestGetGeneralTaskUserByName(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	googleID := "example@generaltask.com"
	name := "Tony the Tiger"

	_, err = GetUserCollection(db).InsertOne(
		context.Background(),
		&User{
			ID:       userID,
			GoogleID: googleID,
			Name:     name,
			Email:    googleID,
		},
	)
	assert.NoError(t, err)

	t.Run("WrongUserID", func(t *testing.T) {
		_, err := GetGeneralTaskUserByName(db, "julian")
		assert.Equal(t, mongo.ErrNoDocuments, err)
	})
	t.Run("Success", func(t *testing.T) {
		user, err := GetGeneralTaskUserByName(db, "example")
		assert.NoError(t, err)
		assert.Equal(t, googleID, user.Email)
		assert.Equal(t, name, user.Name)
	})
}

func TestGetStateToken(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()

	tokenStr, err := CreateStateToken(db, &userID, false)
	assert.NoError(t, err)

	tokenID, err := primitive.ObjectIDFromHex(*tokenStr)
	assert.NoError(t, err)

	t.Run("WrongStateToken", func(t *testing.T) {
		token, err := GetStateToken(db, primitive.NewObjectID(), &userID)
		assert.Equal(t, mongo.ErrNoDocuments, err)
		assert.Nil(t, token)
	})
	t.Run("SuccessNoUserID", func(t *testing.T) {
		token, err := GetStateToken(db, tokenID, nil)
		assert.NoError(t, err)
		assert.Equal(t, tokenID, token.Token)
	})
	t.Run("Success", func(t *testing.T) {
		token, err := GetStateToken(db, tokenID, &userID)
		assert.NoError(t, err)
		assert.Equal(t, tokenID, token.Token)
	})
}

func TestDeleteStateToken(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()

	tokenStr, err := CreateStateToken(db, &userID, false)
	assert.NoError(t, err)

	tokenID, err := primitive.ObjectIDFromHex(*tokenStr)
	assert.NoError(t, err)

	t.Run("WrongStateToken", func(t *testing.T) {
		err := DeleteStateToken(db, primitive.NewObjectID(), &userID)
		assert.Error(t, err)
	})
	t.Run("Success", func(t *testing.T) {
		token, err := GetStateToken(db, tokenID, &userID)
		assert.NoError(t, err)
		assert.Equal(t, tokenID, token.Token)

		err = DeleteStateToken(db, tokenID, &userID)
		assert.NoError(t, err)

		token, err = GetStateToken(db, tokenID, &userID)
		assert.Equal(t, mongo.ErrNoDocuments, err)
	})
}

func TestInsertLogEvent(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	t.Run("Success", func(t *testing.T) {
		InsertLogEvent(db, primitive.NewObjectID(), "dogecoin_to_the_moon")

		logEventsCollection := GetLogEventsCollection(db)
		count, err := logEventsCollection.CountDocuments(context.Background(), bson.M{"event_type": "dogecoin_to_the_moon"})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
}

func TestGetExternalToken(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	serviceID := "test service"
	accountID := "id123"

	_, err = GetExternalTokenCollection(db).InsertOne(
		context.Background(),
		&ExternalAPIToken{
			ServiceID: serviceID,
			AccountID: accountID,
			UserID:    userID,
		},
	)
	assert.NoError(t, err)

	t.Run("WrongUserID", func(t *testing.T) {
		_, err := GetExternalToken(db, "wrong account", serviceID)
		assert.Equal(t, mongo.ErrNoDocuments, err)
	})
	t.Run("Success", func(t *testing.T) {
		token, err := GetExternalToken(db, accountID, serviceID)
		assert.NoError(t, err)
		assert.Equal(t, userID, token.UserID)
		assert.Equal(t, serviceID, token.ServiceID)
		assert.Equal(t, accountID, token.AccountID)
	})
}

func TestGetExternalTokens(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	_, err = GetExternalTokenCollection(db).InsertOne(
		context.Background(),
		&ExternalAPIToken{
			UserID:    userID,
			ServiceID: "elon",
		},
	)
	assert.NoError(t, err)

	t.Run("NoExternalTokens", func(t *testing.T) {
		tokens, err := GetExternalTokens(db, userID, "")
		assert.NoError(t, err)
		assert.Equal(t, 0, len(*tokens))
	})
	t.Run("WrongUserID", func(t *testing.T) {
		tokens, err := GetExternalTokens(db, primitive.NewObjectID(), "elon")
		assert.NoError(t, err)
		assert.Equal(t, 0, len(*tokens))
	})
	t.Run("WrongServiceID", func(t *testing.T) {
		tokens, err := GetExternalTokens(db, userID, "jeff")
		assert.NoError(t, err)
		assert.Equal(t, 0, len(*tokens))
	})
	t.Run("Success", func(t *testing.T) {
		tokens, err := GetExternalTokens(db, userID, "elon")
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tokens))
		assert.Equal(t, "elon", (*tokens)[0].ServiceID)
	})
}

func TestAdjustOrderingIDs(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	id1, err := createTestTaskSectionWithOrderingID(db, userID, 1)
	assert.NoError(t, err)
	id2, err := createTestTaskSectionWithOrderingID(db, userID, 1)
	assert.NoError(t, err)
	id3, err := createTestTaskSectionWithOrderingID(db, userID, 1)
	assert.NoError(t, err)
	id4, err := createTestTaskSectionWithOrderingID(db, userID, 2)
	assert.NoError(t, err)

	t.Run("Success", func(t *testing.T) {
		err := AdjustOrderingIDsForCollection(GetTaskSectionCollection(db), userID, id1, 1)
		assert.NoError(t, err)
		assertTaskSectionOrderingID(t, db, id1, 1)
		assertTaskSectionOrderingID(t, db, id2, 2)
		assertTaskSectionOrderingID(t, db, id3, 3)
		assertTaskSectionOrderingID(t, db, id4, 4)
	})
}

func TestLogRequestInfo(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	taskID := primitive.NewObjectID()

	t.Run("Success", func(t *testing.T) {
		LogRequestInfo(db, time.Now(), userID, "/testing/", 100, &taskID, 200)
		collection := GetServerRequestCollection(db)
		cursor, err := collection.Find(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)

		var requests []ServerRequestInfo
		err = cursor.All(context.Background(), &requests)
		assert.Equal(t, 1, len(requests))
		assert.Equal(t, taskID, requests[0].ObjectID)
		assert.Equal(t, "/testing/", requests[0].Method)
	})
}

func createTestTaskSectionWithOrderingID(db *mongo.Database, userID primitive.ObjectID, orderingID int) (primitive.ObjectID, error) {
	res, err := GetTaskSectionCollection(db).InsertOne(context.Background(), TaskSection{
		UserID:     userID,
		IDOrdering: orderingID,
	})
	if err != nil {
		return primitive.NilObjectID, err
	}
	return res.InsertedID.(primitive.ObjectID), nil
}

func assertTaskSectionOrderingID(t *testing.T, db *mongo.Database, itemID primitive.ObjectID, expectedOrderingID int) {
	var section TaskSection
	err := GetTaskSectionCollection(db).FindOne(context.Background(), bson.M{"_id": itemID}).Decode(&section)
	assert.NoError(t, err)
	assert.Equal(t, expectedOrderingID, section.IDOrdering)
}

func createTestCalendarEvent(db *mongo.Database, userID primitive.ObjectID, dateTimeStart primitive.DateTime) (primitive.ObjectID, error) {
	eventsCollection := GetCalendarEventCollection(db)
	result, err := eventsCollection.InsertOne(
		context.Background(),
		&CalendarEvent{
			UserID:        userID,
			DatetimeStart: dateTimeStart,
		},
	)
	return result.InsertedID.(primitive.ObjectID), err
}
