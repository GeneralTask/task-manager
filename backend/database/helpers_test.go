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

func TestGetEmails(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	task1, err := GetOrCreateTask(
		db,
		userID,
		"email_paginate_task_1",
		"gmail",
		createTestMessage(userID, "email_paginate_task_1", true, createTimestamp("2019-04-20")),
	)
	assert.NoError(t, err)

	task2, err := GetOrCreateTask(
		db,
		userID,
		"email_paginate_task_2",
		"gmail",
		createTestMessage(userID, "email_paginate_task_2", true, createTimestamp("2017-04-20")),
	)
	assert.NoError(t, err)

	task3, err := GetOrCreateTask(
		db,
		userID,
		"email_paginate_task_3",
		"gmail",
		createTestMessage(userID, "email_paginate_task_3", true, createTimestamp("2020-04-20")),
	)
	assert.NoError(t, err)

	task4, err := GetOrCreateTask(
		db,
		userID,
		"email_paginate_task_4",
		"gmail",
		createTestMessage(userID, "email_paginate_task_4", false, createTimestamp("2016-04-20")),
	)

	assert.NoError(t, err)
	t.Run("SuccessUnreadAllInvalidPagination", func(t *testing.T) {
		page := 1
		paged_emails, err := GetEmails(db, userID, true, Pagination{Limit: nil, Page: &page})
		assert.NoError(t, err)
		assert.Equal(t, 3, len(*paged_emails))
		assert.Equal(t, task3.ID, (*paged_emails)[0].ID)
		assert.Equal(t, task1.ID, (*paged_emails)[1].ID)
		assert.Equal(t, task2.ID, (*paged_emails)[2].ID)
	})
	t.Run("SuccessUnreadAllEmptyPagination", func(t *testing.T) {
		paged_emails, err := GetEmails(db, userID, true, Pagination{})
		assert.NoError(t, err)
		assert.Equal(t, 3, len(*paged_emails))
		assert.Equal(t, task3.ID, (*paged_emails)[0].ID)
		assert.Equal(t, task1.ID, (*paged_emails)[1].ID)
		assert.Equal(t, task2.ID, (*paged_emails)[2].ID)
	})
	t.Run("SuccessUnreadLimited", func(t *testing.T) {
		limit := 2
		page := 1
		paged_emails, err := GetEmails(db, userID, true, Pagination{Limit: &limit, Page: &page})
		assert.NoError(t, err)
		assert.Equal(t, 2, len(*paged_emails))
		assert.Equal(t, task3.ID, (*paged_emails)[0].ID)
		assert.Equal(t, task1.ID, (*paged_emails)[1].ID)
	})
	t.Run("SuccessUnreadPaged", func(t *testing.T) {
		limit := 1
		page := 3
		paged_emails, err := GetEmails(db, userID, true, Pagination{Limit: &limit, Page: &page})
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*paged_emails))
		assert.Equal(t, task2.ID, (*paged_emails)[0].ID)
	})
	t.Run("SuccessAll", func(t *testing.T) {
		paged_emails, err := GetEmails(db, userID, false, Pagination{})
		assert.NoError(t, err)
		assert.Equal(t, 4, len(*paged_emails))
		assert.Equal(t, task3.ID, (*paged_emails)[0].ID)
		assert.Equal(t, task1.ID, (*paged_emails)[1].ID)
		assert.Equal(t, task2.ID, (*paged_emails)[2].ID)
		assert.Equal(t, task4.ID, (*paged_emails)[3].ID)
	})
	t.Run("SuccessAllPaged", func(t *testing.T) {
		limit := 2
		page := 2
		paged_emails, err := GetEmails(db, userID, false, Pagination{Limit: &limit, Page: &page})
		assert.NoError(t, err)
		assert.Equal(t, 2, len(*paged_emails))
		assert.Equal(t, task2.ID, (*paged_emails)[0].ID)
		assert.Equal(t, task4.ID, (*paged_emails)[1].ID)
	})
}

func TestGetEmailThreads(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	notUserID := primitive.NewObjectID()
	thread1Email1 := createTestEmail(userID, "thread_1_email_1", true, createTimestamp("2017-04-20"))
	thread1Email2 := createTestEmail(userID, "thread_1_email_2", false, createTimestamp("2019-04-20"))
	thread2Email1 := createTestEmail(userID, "thread_2_email_1", false, createTimestamp("2016-04-20"))
	thread2Email2 := createTestEmail(userID, "thread_2_email_2", false, createTimestamp("2020-04-20"))
	thread3Email1 := createTestEmail(userID, "thread_3_email_1", true, createTimestamp("2015-04-20"))
	thread4Email1 := createTestEmail(userID, "thread_4_email_1", false, createTimestamp("2014-04-20"))
	thread5Email1 := createTestEmail(userID, "thread_5_email_1", false, createTimestamp("2014-04-20"))
	// Threads' LastUpdatedAt descending order should be [thread2, thread1, thread3, thread4]
	// Unread threads should be [thread1, thread3]
	// thread 5 does not belong to user

	thread1, err := GetOrCreateTask(
		db,
		userID,
		"email_thread_id_1",
		"gmail",
		createTestThread(userID, "email_thread_id_1", createTimestamp("2019-04-20"), &[]Email{*thread1Email1, *thread1Email2}),
	)
	assert.NoError(t, err)

	thread2, err := GetOrCreateTask(
		db,
		userID,
		"email_thread_id_2",
		"gmail",
		createTestThread(userID, "email_thread_id_2", createTimestamp("2020-04-20"), &[]Email{*thread2Email1, *thread2Email2}),
	)
	assert.NoError(t, err)

	thread3, err := GetOrCreateTask(
		db,
		userID,
		"email_thread_id_3",
		"gmail",
		createTestThread(userID, "email_thread_id_3", createTimestamp("2015-04-20"), &[]Email{*thread3Email1}),
	)
	assert.NoError(t, err)

	thread4, err := GetOrCreateTask(
		db,
		userID,
		"email_thread_id_4",
		"gmail",
		createTestThread(userID, "email_thread_id_4", createTimestamp("2014-04-20"), &[]Email{*thread4Email1}),
	)
	assert.NoError(t, err)

	_, err = GetOrCreateTask(
		db,
		notUserID,
		"email_thread_id_5",
		"gmail",
		createTestThread(userID, "email_thread_id_5", createTimestamp("2014-04-20"), &[]Email{*thread5Email1}),
	)
	assert.NoError(t, err)

	assert.NoError(t, err)
	t.Run("SuccessAllInvalidPagination", func(t *testing.T) {
		page := 1
		paged_emails, err := GetEmailThreads(db, userID, false, Pagination{Limit: nil, Page: &page})
		assert.NoError(t, err)
		assert.Equal(t, 4, len(*paged_emails))
		assert.Equal(t, thread2.ID, (*paged_emails)[0].ID)
		assert.Equal(t, thread1.ID, (*paged_emails)[1].ID)
		assert.Equal(t, thread3.ID, (*paged_emails)[2].ID)
		assert.Equal(t, thread4.ID, (*paged_emails)[3].ID)
	})
	t.Run("SuccessAllEmptyPagination", func(t *testing.T) {
		paged_emails, err := GetEmailThreads(db, userID, false, Pagination{})
		assert.NoError(t, err)
		assert.Equal(t, 4, len(*paged_emails))
		assert.Equal(t, thread2.ID, (*paged_emails)[0].ID)
		assert.Equal(t, thread1.ID, (*paged_emails)[1].ID)
		assert.Equal(t, thread3.ID, (*paged_emails)[2].ID)
		assert.Equal(t, thread4.ID, (*paged_emails)[3].ID)
	})
	t.Run("SuccessLimited", func(t *testing.T) {
		limit := 2
		page := 1
		paged_emails, err := GetEmailThreads(db, userID, false, Pagination{Limit: &limit, Page: &page})
		assert.NoError(t, err)
		assert.Equal(t, 2, len(*paged_emails))
		assert.Equal(t, thread2.ID, (*paged_emails)[0].ID)
		assert.Equal(t, thread1.ID, (*paged_emails)[1].ID)
	})
	t.Run("SuccessPaged", func(t *testing.T) {
		limit := 1
		page := 3
		paged_emails, err := GetEmailThreads(db, userID, false, Pagination{Limit: &limit, Page: &page})
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*paged_emails))
		assert.Equal(t, thread3.ID, (*paged_emails)[0].ID)
	})
	t.Run("SuccessLimitedAndPaged", func(t *testing.T) {
		limit := 2
		page := 2
		paged_emails, err := GetEmailThreads(db, userID, false, Pagination{Limit: &limit, Page: &page})
		assert.NoError(t, err)
		assert.Equal(t, 2, len(*paged_emails))
		assert.Equal(t, thread3.ID, (*paged_emails)[0].ID)
		assert.Equal(t, thread4.ID, (*paged_emails)[1].ID)
	})
	t.Run("SuccessOnlyUnread", func(t *testing.T) {
		paged_emails, err := GetEmailThreads(db, userID, true, Pagination{})
		assert.NoError(t, err)
		assert.Equal(t, 2, len(*paged_emails))
		assert.Equal(t, thread1.ID, (*paged_emails)[0].ID)
		assert.Equal(t, thread3.ID, (*paged_emails)[1].ID)
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

func createTestMessage(userID primitive.ObjectID, externalID string, isUnread bool, createdAt time.Time) *Item {
	return &Item{
		Email: Email{
			SenderDomain: "gmail",
			IsUnread:     isUnread,
		},
		TaskBase: TaskBase{
			IDExternal:        externalID,
			CreatedAtExternal: primitive.NewDateTimeFromTime(createdAt),
			SourceID:          "gmail",
			UserID:            userID,
		},
		TaskType: TaskType{
			IsMessage: true,
		},
	}
}

func createTestThread(userID primitive.ObjectID, externalID string, lastUpdatedAt time.Time, emails *[]Email) *Item {
	return &Item{
		TaskBase: TaskBase{
			IDExternal: externalID,
			SourceID:   "gmail",
			UserID:     userID,
		},
		EmailThread: EmailThread{
			ThreadID:      externalID,
			LastUpdatedAt: primitive.NewDateTimeFromTime(lastUpdatedAt),
			Emails:        *emails,
		},
		TaskType: TaskType{
			IsThread: true,
		},
	}
}

func createTestEmail(userID primitive.ObjectID, externalID string, isUnread bool, createdAt time.Time) *Email {
	return &Email{
		EmailID:      externalID,
		SenderDomain: "gmail",
		IsUnread:     isUnread,
		SentAt:       primitive.NewDateTimeFromTime(createdAt),
	}
}

func createTimestamp(dt string) time.Time {
	createdAt, _ := time.Parse("2006-01-02", dt)
	return createdAt
}
