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
		tasks, err := GetTasks(db, userID, nil)
		assert.NoError(t, err)
		assert.Equal(t, 2, len(*tasks))
		assert.Equal(t, task1.ID, (*tasks)[0].ID)
		assert.Equal(t, task2.ID, (*tasks)[1].ID)
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

	t.Run("NoUpdateIfTaskExistsAndInMissing", func(t *testing.T) {
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

	t.Run("Success", func(t *testing.T) {
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

	t.Run("Success", func(t *testing.T) {
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
	ctx := context.Background()
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
		respTask, err := GetTask(db, ctx, primitive.NewObjectID(), userID)
		assert.Equal(t, mongo.ErrNoDocuments, err)
		assert.Nil(t, respTask)
	})
	t.Run("WrongUserID", func(t *testing.T) {
		respTask, err := GetTask(db, ctx, task1.ID, primitive.NewObjectID())
		assert.Equal(t, mongo.ErrNoDocuments, err)
		assert.Nil(t, respTask)
	})
	t.Run("Success", func(t *testing.T) {
		respTask, err := GetTask(db, ctx, task1.ID, userID)
		assert.NoError(t, err)
		assert.Equal(t, task1.ID, respTask.ID)
	})
}

func TestGetCalendarEvent(t *testing.T) {
	ctx := context.Background()
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
		respEvent, err := GetCalendarEvent(db, ctx, primitive.NewObjectID(), userID)
		assert.Equal(t, mongo.ErrNoDocuments, err)
		assert.Nil(t, respEvent)
	})
	t.Run("WrongUserID", func(t *testing.T) {
		respEvent, err := GetCalendarEvent(db, ctx, event.ID, primitive.NewObjectID())
		assert.Equal(t, mongo.ErrNoDocuments, err)
		assert.Nil(t, respEvent)
	})
	t.Run("Success", func(t *testing.T) {
		respEvent, err := GetCalendarEvent(db, ctx, event.ID, userID)
		assert.NoError(t, err)
		assert.Equal(t, event.ID, respEvent.ID)
	})
}

func TestGetPullRequestByExternalID(t *testing.T) {
	ctx := context.Background()
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
		respPR, err := GetPullRequestByExternalID(db, ctx, "wrong ID", userID)
		assert.Equal(t, mongo.ErrNoDocuments, err)
		assert.Nil(t, respPR)
	})
	t.Run("WrongUserID", func(t *testing.T) {
		respPR, err := GetPullRequestByExternalID(db, ctx, pullRequest.IDExternal, primitive.NewObjectID())
		assert.Equal(t, mongo.ErrNoDocuments, err)
		assert.Nil(t, respPR)
	})
	t.Run("Success", func(t *testing.T) {
		respPR, err := GetPullRequestByExternalID(db, ctx, pullRequest.IDExternal, userID)
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

func TestTaskSectionName(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()

	t.Run("Default task section", func(t *testing.T) {
		name, err := GetTaskSectionName(db, constants.IDTaskSectionDefault, userID)
		assert.NoError(t, err)
		assert.Equal(t, "Default", name)
	})
	t.Run("Custom task section", func(t *testing.T) {
		parentCtx := context.Background()
		sectionName := "TestSection"
		taskSectionCollection := GetTaskSectionCollection(db)

		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		res, err := taskSectionCollection.InsertOne(
			dbCtx,
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
	t.Run("No task section with provided ID", func(t *testing.T) {
		db, dbCleanup, err := GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		name, err := GetTaskSectionName(db, primitive.NewObjectID(), userID)
		assert.Error(t, err)
		assert.Equal(t, "", name)
	})
}

func TestGetTaskSections(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()

	t.Run("No task sections", func(t *testing.T) {
		sections, err := GetTaskSections(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 0, len(*sections))
	})
	t.Run("Custom task section", func(t *testing.T) {
		parentCtx := context.Background()
		sectionName := "TestSection"
		taskSectionCollection := GetTaskSectionCollection(db)

		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		_, err := taskSectionCollection.InsertOne(
			dbCtx,
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
}

func TestGetUser(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	googleID := "example@generaltask.com"
	name := "Tony the Tiger"

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = GetUserCollection(db).InsertOne(
		dbCtx,
		&User{
			ID:       userID,
			GoogleID: googleID,
			Name:     name,
		},
	)
	assert.NoError(t, err)

	t.Run("Failure", func(t *testing.T) {
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

func TestGetStateToken(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()

	tokenStr, err := CreateStateToken(db, &userID, false)
	assert.NoError(t, err)

	tokenID, err := primitive.ObjectIDFromHex(*tokenStr)
	assert.NoError(t, err)

	t.Run("Failure", func(t *testing.T) {
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

	t.Run("Failure", func(t *testing.T) {
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

		dbCtx, cancel := context.WithTimeout(context.Background(), constants.DatabaseTimeout)
		defer cancel()
		logEventsCollection := GetLogEventsCollection(db)
		count, err := logEventsCollection.CountDocuments(dbCtx, bson.M{"event_type": "dogecoin_to_the_moon"})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
}

func TestGetExternalToken(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	serviceID := "test service"
	accountID := "id123"

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = GetExternalTokenCollection(db).InsertOne(
		dbCtx,
		&ExternalAPIToken{
			ServiceID: serviceID,
			AccountID: accountID,
			UserID:    userID,
		},
	)
	assert.NoError(t, err)

	t.Run("Failure", func(t *testing.T) {
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
