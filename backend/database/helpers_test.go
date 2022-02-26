package database

import (
	"context"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestGetTasks(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	notUserID := primitive.NewObjectID()
	task1, err := GetOrCreateTask(
		db,
		userID,
		"123abc",
		"foobar_source",
		&Item{
			TaskBase: TaskBase{
				IDExternal: "123abc",
				SourceID:   "foobar_source",
				UserID:     userID,
			},
			TaskType: TaskType{
				IsTask: true,
			},
		},
	)
	assert.NoError(t, err)
	task2, err := GetOrCreateTask(
		db,
		userID,
		"123abcde",
		"foobar_source",
		&Item{
			TaskBase: TaskBase{
				IDExternal:  "123abcde",
				SourceID:    "foobar_source",
				UserID:      userID,
				IsCompleted: true,
			},
			TaskType: TaskType{
				IsTask: true,
			},
		},
	)
	assert.NoError(t, err)
	_, err = GetOrCreateTask(
		db,
		userID,
		"123abd",
		"gmail",
		&Item{
			Email: Email{
				SenderDomain: "gmail",
			},
			TaskBase: TaskBase{
				IDExternal: "123abd",
				SourceID:   "gmail",
				UserID:     userID,
			},
			TaskType: TaskType{
				IsMessage: true,
			},
		},
	)
	assert.NoError(t, err)
	_, err = GetOrCreateTask(
		db,
		userID,
		"123abdef",
		"gmail",
		&Item{
			Email: Email{
				SenderDomain: "gmail",
			},
			TaskBase: TaskBase{
				IDExternal:  "123abdef",
				SourceID:    "gmail",
				UserID:      userID,
				IsCompleted: true,
			},
			TaskType: TaskType{
				IsMessage: true,
			},
		},
	)
	assert.NoError(t, err)
	_, err = GetOrCreateTask(
		db,
		notUserID,
		"123abe",
		"foobar_source",
		&Item{
			TaskBase: TaskBase{
				IDExternal: "123abe",
				SourceID:   "foobar_source",
				UserID:     notUserID,
			},
			TaskType: TaskType{
				IsTask: true,
			},
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
		&Item{
			TaskBase: TaskBase{
				IDExternal: "123abc",
				SourceID:   "foobar_source",
				UserID:     userID,
			},
			TaskType: TaskType{
				IsTask: true,
			},
		},
	)
	assert.NoError(t, err)
	t.Run("SuccessIdempotent", func(t *testing.T) {
		MarkItemComplete(db, task1.ID)
		tasks, err := GetCompletedTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		updatedTask := (*tasks)[0]
		assert.True(t, updatedTask.IsCompleted)
		assert.NotEqual(t, task1.CompletedAt, updatedTask.CompletedAt)

		// ensure timestamp advances enough to be different
		time.Sleep(time.Millisecond)

		MarkItemComplete(db, task1.ID)
		tasks, err = GetCompletedTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		updatedTask2 := (*tasks)[0]
		assert.True(t, updatedTask2.IsCompleted)
		assert.NotEqual(t, updatedTask.CompletedAt, updatedTask2.CompletedAt)
	})
}

func TestGetUnreadEmails(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		db, dbCleanup, err := GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		userID := primitive.NewObjectID()
		notUserID := primitive.NewObjectID()
		task1, err := GetOrCreateTask(
			db,
			userID,
			"123abc",
			"gmail",
			&Item{
				Email: Email{
					SenderDomain: "gmail",
					IsUnread:     true,
				},
				TaskBase: TaskBase{
					IDExternal: "123abc",
					SourceID:   "gmail",
					UserID:     userID,
				},
				TaskType: TaskType{
					IsMessage: true,
				},
			},
		)
		assert.NoError(t, err)
		_, err = GetOrCreateTask(
			db,
			userID,
			"123abcdef",
			"gmail",
			&Item{
				Email: Email{
					SenderDomain: "gmail",
					IsUnread:     false,
				},
				TaskBase: TaskBase{
					IDExternal: "123abcdef",
					SourceID:   "gmail",
					UserID:     userID,
				},
				TaskType: TaskType{
					IsMessage: true,
				},
			},
		)
		assert.NoError(t, err)
		_, err = GetOrCreateTask(
			db,
			notUserID,
			"123abd",
			"gmail",
			&Item{
				Email: Email{
					SenderDomain: "gmail",
				},
				TaskBase: TaskBase{
					IDExternal: "123abd",
					SourceID:   "gmail",
					UserID:     notUserID,
				},
				TaskType: TaskType{
					IsMessage: true,
				},
			},
		)
		assert.NoError(t, err)
		_, err = GetOrCreateTask(
			db,
			userID,
			"123abe",
			"foobar_source",
			&Item{TaskBase: TaskBase{
				IDExternal: "123abe",
				SourceID:   "foobar_source",
				UserID:     userID,
			}},
		)
		assert.NoError(t, err)

		emails, err := GetEmails(db, userID, true, Pagination{})
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*emails))
		assert.Equal(t, task1.ID, (*emails)[0].ID)
	})
}

func TestGetUnreadEmailsPaged(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	createdAt, _ := time.Parse("2006-01-02", "2019-04-20")
	task1, err := GetOrCreateTask(
		db,
		userID,
		"email_paginate_task_1",
		"gmail",
		&Item{
			Email: Email{
				SenderDomain: "gmail",
				IsUnread:     true,
			},
			TaskBase: TaskBase{
				IDExternal:        "email_paginate_task_1",
				CreatedAtExternal: primitive.NewDateTimeFromTime(createdAt),
				SourceID:          "gmail",
				UserID:            userID,
			},
			TaskType: TaskType{
				IsMessage: true,
			},
		},
	)
	assert.NoError(t, err)

	createdAt, _ = time.Parse("2006-01-02", "2017-04-20")
	task2, err := GetOrCreateTask(
		db,
		userID,
		"email_paginate_task_2",
		"gmail",
		&Item{
			Email: Email{
				SenderDomain: "gmail",
				IsUnread:     true,
			},
			TaskBase: TaskBase{
				IDExternal:        "email_paginate_task_2",
				CreatedAtExternal: primitive.NewDateTimeFromTime(createdAt),
				SourceID:          "gmail",
				UserID:            userID,
			},
			TaskType: TaskType{
				IsMessage: true,
			},
		},
	)
	assert.NoError(t, err)

	createdAt, _ = time.Parse("2006-01-02", "2020-04-20")
	task3, err := GetOrCreateTask(
		db,
		userID,
		"email_paginate_task_3",
		"gmail",
		&Item{
			Email: Email{
				SenderDomain: "gmail",
				IsUnread:     true,
			},
			TaskBase: TaskBase{
				IDExternal:        "email_paginate_task_3",
				CreatedAtExternal: primitive.NewDateTimeFromTime(createdAt),
				SourceID:          "gmail",
				UserID:            userID,
			},
			TaskType: TaskType{
				IsMessage: true,
			},
		},
	)
	assert.NoError(t, err)
	t.Run("SuccessAllOrdering", func(t *testing.T) {
		limit := 3
		page := 1
		paged_emails, err := GetEmails(db, userID, true, Pagination{Limit: &limit, Page: &page})
		assert.NoError(t, err)
		assert.Equal(t, 3, len(*paged_emails))
		assert.Equal(t, task3.ID, (*paged_emails)[0].ID)
		assert.Equal(t, task1.ID, (*paged_emails)[1].ID)
		assert.Equal(t, task2.ID, (*paged_emails)[2].ID)
	})
	t.Run("SuccessPaged", func(t *testing.T) {
		limit := 1
		page := 3
		paged_emails, err := GetEmails(db, userID, true, Pagination{Limit: &limit, Page: &page})
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*paged_emails))
		assert.Equal(t, task2.ID, (*paged_emails)[0].ID)
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
