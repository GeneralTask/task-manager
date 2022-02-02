package database

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestGetActiveTasks(t *testing.T) {
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
			"foobar_source",
			&Item{TaskBase: TaskBase{
				IDExternal: "123abc",
				SourceID:   "foobar_source",
				UserID:     userID,
			}},
		)
		assert.NoError(t, err)
		_, err = GetOrCreateTask(
			db,
			userID,
			"123abd",
			"foobar_source",
			&Item{
				Email: &Email{
					SenderDomain: "gmail",
				},
				TaskBase: TaskBase{
					IDExternal: "123abd",
					SourceID:   "foobar_source",
					UserID:     userID,
				},
			},
		)
		assert.NoError(t, err)
		_, err = GetOrCreateTask(
			db,
			notUserID,
			"123abe",
			"foobar_source",
			&Item{TaskBase: TaskBase{
				IDExternal: "123abe",
				SourceID:   "foobar_source",
				UserID:     notUserID,
			}},
		)
		assert.NoError(t, err)

		tasks, err := GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		assert.Equal(t, task1.ID, (*tasks)[0].ID)
	})
}

func TestGetActiveEmails(t *testing.T) {
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
			"foobar_source",
			&Item{
				Email: &Email{
					SenderDomain: "gmail",
				},
				TaskBase: TaskBase{
					IDExternal: "123abc",
					SourceID:   "foobar_source",
					UserID:     userID,
				},
			},
		)
		assert.NoError(t, err)
		_, err = GetOrCreateTask(
			db,
			notUserID,
			"123abd",
			"foobar_source",
			&Item{
				Email: &Email{
					SenderDomain: "gmail",
				},
				TaskBase: TaskBase{
					IDExternal: "123abd",
					SourceID:   "foobar_source",
					UserID:     notUserID,
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

		emails, err := GetActiveEmails(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*emails))
		assert.Equal(t, task1.ID, (*emails)[0].ID)
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
