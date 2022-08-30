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


func createTestCalendarEvent(extCtx context.Context, db *mongo.Database, userID primitive.ObjectID, dateTimeStart primitive.DateTime) (primitive.ObjectID, error) {
	eventsCollection := GetCalendarEventCollection(db)
	dbCtx, cancel := context.WithTimeout(extCtx, constants.DatabaseTimeout)
	defer cancel()
	result, err := eventsCollection.InsertOne(
		dbCtx,
		&CalendarEvent{
			UserID: userID,
			DatetimeStart: dateTimeStart,
		},
	)
	return result.InsertedID.(primitive.ObjectID), err
}

func TestGetEventsUntilEndOfDay(t *testing.T) {
	parentContext := context.Background()
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()
	notUserID := primitive.NewObjectID()
	timeBase := time.Date(2022, 1, 1, 0, 0, 0, 0, time.UTC)
	timeHourLater := time.Date(2022, 1, 1, 1, 0, 0, 0, time.UTC)
	timeDayLater := time.Date(2022, 1, 2, 0, 0, 0, 0, time.UTC)

	eventID, err := createTestCalendarEvent(parentContext, db, userID, primitive.NewDateTimeFromTime(timeHourLater))
	assert.NoError(t, err)
	// Event create a day later should not be in the result
	_, err = createTestCalendarEvent(parentContext, db, userID, primitive.NewDateTimeFromTime(timeDayLater))
	assert.NoError(t, err)
	// Incorrect UserID
	_, err = createTestCalendarEvent(parentContext, db, notUserID, primitive.NewDateTimeFromTime(timeHourLater))
	assert.NoError(t, err)

	t.Run("Success", func(t *testing.T) {
		events, err := GetEventsUntilEndOfDay(parentContext, db, userID, timeBase)
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
