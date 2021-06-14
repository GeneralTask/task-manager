package api

import (
	"context"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestMergeTasks(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	taskCollection := db.Collection("tasks")
	defer dbCleanup()

	t.Run("SimpleMerge", func(t *testing.T) {
		c1ID := primitive.NewObjectID()
		c1 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				ID:         c1ID,
				IDExternal: "standard_event",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     database.TaskSourceGoogleCalendar,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(time.Hour + time.Minute)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 2)),
		}

		c2ID := primitive.NewObjectID()
		c2 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				ID:         c2ID,
				IDExternal: "standard_event_2",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event_2",
				Source:     database.TaskSourceGoogleCalendar,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(time.Hour*3 + time.Minute*20)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 4)),
		}

		e1ID := primitive.NewObjectID()
		e1 := database.Email{
			TaskBase: database.TaskBase{
				ID:              e1ID,
				IDExternal:      "sample_email",
				Deeplink:        "generaltask.io",
				Title:           "Respond to this email",
				Source:          database.TaskSourceGmail,
				TimeAllocation:  (time.Minute * 5).Nanoseconds(),
				SourceAccountID: "elon@gmail.com",
			},
			SenderDomain: "gmail.com",
			TimeSent:     primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
		}
		e1aID := primitive.NewObjectID()
		e1a := database.Email{
			TaskBase: database.TaskBase{
				ID:              e1aID,
				IDExternal:      "sample_emailA",
				Deeplink:        "generaltask.io",
				Title:           "Respond to this email",
				Source:          database.TaskSourceGmail,
				TimeAllocation:  (time.Minute * 5).Nanoseconds(),
				SourceAccountID: "elon@moon.com",
			},
			SenderDomain: "moon.com",
			TimeSent:     primitive.NewDateTimeFromTime(time.Now().Add(-time.Minute)),
		}

		e2ID := primitive.NewObjectID()
		e2 := database.Email{
			TaskBase: database.TaskBase{
				ID:              e2ID,
				IDExternal:      "sample_email_2",
				Deeplink:        "generaltask.io",
				Title:           "Respond to this email...eventually",
				Source:          database.TaskSourceGmail,
				TimeAllocation:  (time.Minute * 2).Nanoseconds(),
				SourceAccountID: "elon@gmail.com",
			},
			SenderDomain: "yahoo.com",
			TimeSent:     primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
		}

		t1ID := primitive.NewObjectID()
		t1 := database.Task{
			TaskBase: database.TaskBase{
				ID:              t1ID,
				IDExternal:      "sample_task",
				Deeplink:        "generaltask.io",
				Title:           "Code x",
				Source:          database.TaskSourceJIRA,
				TimeAllocation:  (time.Hour).Nanoseconds(),
				SourceAccountID: "JIRASite2",
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24)),
			PriorityID: "5",
			TaskNumber: 2,
		}

		t2ID := primitive.NewObjectID()
		t2 := database.Task{
			TaskBase: database.TaskBase{
				ID:              t2ID,
				IDExternal:      "sample_task1",
				Deeplink:        "generaltask.io",
				Title:           "Code x",
				Source:          database.TaskSourceJIRA,
				TimeAllocation:  (time.Hour).Nanoseconds(),
				SourceAccountID: "JIRASite1",
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			PriorityID: "3",
			TaskNumber: 12,
		}

		t3ID := primitive.NewObjectID()
		t3 := database.Task{
			TaskBase: database.TaskBase{
				ID:              t3ID,
				IDExternal:      "sample_task2",
				Deeplink:        "generaltask.io",
				Title:           "Code x",
				Source:          database.TaskSourceJIRA,
				TimeAllocation:  (time.Hour).Nanoseconds(),
				SourceAccountID: "JIRASite1",
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID: "1",
			TaskNumber: 7,
		}

		t4ID := primitive.NewObjectID()
		t4 := database.Task{
			TaskBase: database.TaskBase{
				ID:              t4ID,
				IDExternal:      "sample_task3",
				Deeplink:        "generaltask.io",
				Title:           "Code x",
				Source:          database.TaskSourceJIRA,
				TimeAllocation:  (time.Hour).Nanoseconds(),
				SourceAccountID: "JIRASite1",
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID: "3",
			TaskNumber: 1,
		}

		priorityMapping := map[string]*map[string]int{
			"JIRASite1": {
				"1": 1,
				"3": 3,
			},
			"JIRASite2": {
				"5": 5,
			},
		}

		result, err := MergeTasks(
			db,
			&[]database.TaskBase{},
			[]*database.CalendarEvent{&c1, &c2},
			[]*database.Email{&e1, &e1a, &e2},
			[]*database.Task{&t1, &t2, &t3, &t4},
			&priorityMapping,
			"gmail.com")
		assert.NoError(t, err)

		//need to improve these asserts to compare values as well but a pain with casting
		//for now so we'll compare JSON later.
		assert.Equal(t, len(result), 5)

		assert.Equal(t, 2, len(result[0].Tasks))
		assert.Equal(t, database.UnscheduledGroup, result[0].TaskGroupType)
		assert.Equal(t, e1ID, result[0].Tasks[0].ID)
		assert.Equal(t, 1, result[0].Tasks[0].IDOrdering)
		assert.Equal(t, e1aID, result[0].Tasks[1].ID)
		assert.Equal(t, 2, result[0].Tasks[1].IDOrdering)

		assert.Equal(t, 1, len(result[1].Tasks))
		assert.Equal(t, database.ScheduledTask, result[1].TaskGroupType)
		assert.Equal(t, c1ID, result[1].Tasks[0].ID)
		assert.Equal(t, 3, result[1].Tasks[0].IDOrdering)

		assert.Equal(t, 1, len(result[2].Tasks))
		assert.Equal(t, database.UnscheduledGroup, result[2].TaskGroupType)
		assert.Equal(t, t1ID, result[2].Tasks[0].ID)
		assert.Equal(t, 4, result[2].Tasks[0].IDOrdering)

		assert.Equal(t, 1, len(result[3].Tasks))
		assert.Equal(t, database.ScheduledTask, result[3].TaskGroupType)
		assert.Equal(t, c2ID, result[3].Tasks[0].ID)
		assert.Equal(t, 5, result[3].Tasks[0].IDOrdering)

		assert.Equal(t, 4, len(result[4].Tasks))
		assert.Equal(t, database.UnscheduledGroup, result[4].TaskGroupType)
		assert.Equal(t, t3ID, result[4].Tasks[0].ID)
		assert.Equal(t, 6, result[4].Tasks[0].IDOrdering)

		assert.Equal(t, t4ID, result[4].Tasks[1].ID)
		assert.Equal(t, 7, result[4].Tasks[1].IDOrdering)

		assert.Equal(t, t2ID, result[4].Tasks[2].ID)
		assert.Equal(t, 8, result[4].Tasks[2].IDOrdering)

		assert.Equal(t, e2ID, result[4].Tasks[3].ID)
		assert.Equal(t, 9, result[4].Tasks[3].IDOrdering)
	})
	t.Run("ReorderingAroundCalendarEvents", func(t *testing.T) {
		// Tested here:
		// 1) tasks that were reordered before a meeting should stay that way even if time estimates push it back
		// 2) tasks that were reordered after a meeting should stay that way even if time estimates pull it forward

		userID := primitive.NewObjectID()
		t1 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:       1,
				HasBeenReordered: true,
				IDExternal:       "sample_task",
				Deeplink:         "generaltask.io",
				Title:            "Code x",
				Source:           database.TaskSourceJIRA,
				TimeAllocation:   (time.Hour).Nanoseconds(),
				UserID:           userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID: "5",
			TaskNumber: 7,
		}
		t1Res, err := database.GetOrCreateTask(db, userID, "sample_task", database.TaskSourceJIRA, t1)
		assert.NoError(t, err)
		t1.ID = t1Res.ID

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:       5,
				HasBeenReordered: true,
				IDExternal:       "sample_task2",
				Deeplink:         "generaltask.io",
				Title:            "Code x",
				Source:           database.TaskSourceJIRA,
				TimeAllocation:   (time.Hour).Nanoseconds(),
				UserID:           userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			PriorityID: "3",
			TaskNumber: 12,
		}
		t2Res, err := database.GetOrCreateTask(db, userID, "sample_task2", database.TaskSourceJIRA, t2)
		assert.NoError(t, err)
		t2.ID = t2Res.ID

		c1 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering: 3,
				IDExternal: "standard_event",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     database.TaskSourceGoogleCalendar,
				UserID:     userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(20 * time.Minute)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 2)),
		}
		c1Res, err := database.GetOrCreateTask(db, userID, "standard_event", database.TaskSourceGoogleCalendar, c1)
		assert.NoError(t, err)
		c1.ID = c1Res.ID

		c2 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering: 4,
				IDExternal: "standard_event2",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     database.TaskSourceGoogleCalendar,
				UserID:     userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 5)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 6)),
		}
		c2Res, err := database.GetOrCreateTask(db, userID, "standard_event2", database.TaskSourceGoogleCalendar, c2)
		assert.NoError(t, err)
		c2.ID = c2Res.ID

		c3 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				// IDOrdering = 0 means cal event isn't included in reordering adjustments
				IDOrdering: 0,
				IDExternal: "standard_event3",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     database.TaskSourceGoogleCalendar,
				UserID:     userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 7)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 8)),
		}
		c3Res, err := database.GetOrCreateTask(db, userID, "standard_event3", database.TaskSourceGoogleCalendar, c3)
		assert.NoError(t, err)
		c3.ID = c3Res.ID

		priorityMapping := map[string]*map[string]int{
			"": {
				"3": 3,
				"5": 5,
			},
		}

		result, err := MergeTasks(
			db,
			&[]database.TaskBase{c1.TaskBase, c2.TaskBase, c3.TaskBase, t1.TaskBase, t2.TaskBase},
			[]*database.CalendarEvent{&c1, &c2, &c3},
			[]*database.Email{},
			[]*database.Task{&t1, &t2},
			&priorityMapping,
			"gmail.com",
		)
		assert.NoError(t, err)

		assert.Equal(t, 5, len(result))
		assert.Equal(t, t1.ID, result[0].Tasks[0].ID)
		assert.Equal(t, 1, getTaskForTest(t, taskCollection, t1.ID).IDOrdering)

		assert.Equal(t, c1.ID, result[1].Tasks[0].ID)
		assert.Equal(t, 2, getTaskForTest(t, taskCollection, c1.ID).IDOrdering)

		assert.Equal(t, c2.ID, result[2].Tasks[0].ID)
		assert.Equal(t, 3, getTaskForTest(t, taskCollection, c2.ID).IDOrdering)

		assert.Equal(t, t2.ID, result[3].Tasks[0].ID)
		assert.Equal(t, 4, getTaskForTest(t, taskCollection, t2.ID).IDOrdering)

		assert.Equal(t, c3.ID, result[4].Tasks[0].ID)
		assert.Equal(t, 5, getTaskForTest(t, taskCollection, c3.ID).IDOrdering)
	})
	t.Run("ReorderingPersist", func(t *testing.T) {
		// Tested here: existing DB ordering IDs are kept (except cal events)

		userID := primitive.NewObjectID()
		t1 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     1,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.io",
				Title:          "Code x",
				Source:         database.TaskSourceJIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID: "5",
			TaskNumber: 7,
		}
		t1Res, err := database.GetOrCreateTask(db, userID, "sample_task", database.TaskSourceJIRA, t1)
		assert.NoError(t, err)
		t1.ID = t1Res.ID

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     4,
				IDExternal:     "sample_task2",
				Deeplink:       "generaltask.io",
				Title:          "Code x",
				Source:         database.TaskSourceJIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			PriorityID: "3",
			TaskNumber: 12,
		}
		t2Res, err := database.GetOrCreateTask(db, userID, "sample_task2", database.TaskSourceJIRA, t2)
		assert.NoError(t, err)
		t2.ID = t2Res.ID

		c1 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering: 3,
				IDExternal: "standard_event",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     database.TaskSourceGoogleCalendar,
				UserID:     userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(20 * time.Minute)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 2)),
		}
		c1Res, err := database.GetOrCreateTask(db, userID, "standard_event", database.TaskSourceGoogleCalendar, c1)
		assert.NoError(t, err)
		c1.ID = c1Res.ID

		c2 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering: 2,
				IDExternal: "standard_event2",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     database.TaskSourceGoogleCalendar,
				UserID:     userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 5)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 6)),
		}
		c2Res, err := database.GetOrCreateTask(db, userID, "standard_event2", database.TaskSourceGoogleCalendar, c2)
		assert.NoError(t, err)
		c2.ID = c2Res.ID

		priorityMapping := map[string]*map[string]int{
			"": {
				"3": 3,
				"5": 5,
			},
		}

		result, err := MergeTasks(
			db,
			&[]database.TaskBase{c1.TaskBase, c2.TaskBase, t1.TaskBase, t2.TaskBase},
			[]*database.CalendarEvent{&c1, &c2},
			[]*database.Email{},
			[]*database.Task{&t1, &t2},
			&priorityMapping,
			"gmail.com",
		)
		assert.NoError(t, err)

		assert.Equal(t, 3, len(result))
		assert.Equal(t, 1, len(result[0].Tasks))
		assert.Equal(t, 2, len(result[1].Tasks))
		assert.Equal(t, 1, len(result[2].Tasks))

		assert.Equal(t, c1.ID, result[0].Tasks[0].ID)
		assert.Equal(t, t1.ID, result[1].Tasks[0].ID)
		assert.Equal(t, t2.ID, result[1].Tasks[1].ID)
		assert.Equal(t, c2.ID, result[2].Tasks[0].ID)
	})
	t.Run("ReorderingOldNew", func(t *testing.T) {
		// Tested here:
		// 1) new tasks are inserted ignoring reordered tasks
		// 2) completed tasks are marked such in the db
		// TODO next:
		// 3) completed tasks cause reordered tasks to move up in list

		userID := primitive.NewObjectID()
		t1ID := primitive.NewObjectID()
		t1 := database.Task{
			TaskBase: database.TaskBase{
				ID:             t1ID,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.io",
				Title:          "Code x",
				Source:         database.TaskSourceJIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 1)),
			PriorityID: "1",
			TaskNumber: 7,
		}

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:       4,
				HasBeenReordered: true,
				IDExternal:       "sample_task2",
				Deeplink:         "generaltask.io",
				Title:            "Code x",
				Source:           database.TaskSourceJIRA,
				TimeAllocation:   (time.Hour).Nanoseconds(),
				UserID:           userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			PriorityID: "3",
			TaskNumber: 12,
		}
		t2Res, err := database.GetOrCreateTask(db, userID, "sample_task2", database.TaskSourceJIRA, t2)
		assert.NoError(t, err)
		t2.ID = t2Res.ID

		c1 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering: 3,
				IDExternal: "standard_event",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     database.TaskSourceGoogleCalendar,
				UserID:     userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(20 * time.Minute)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 2)),
		}
		c1Res, err := database.GetOrCreateTask(db, userID, "standard_event", database.TaskSourceGoogleCalendar, c1)
		assert.NoError(t, err)
		c1.ID = c1Res.ID

		priorityMapping := map[string]*map[string]int{
			"": {
				"1": 1,
				"3": 3,
			},
		}

		result, err := MergeTasks(
			db,
			&[]database.TaskBase{c1.TaskBase, t2.TaskBase},
			[]*database.CalendarEvent{},
			[]*database.Email{},
			[]*database.Task{&t1, &t2},
			&priorityMapping,
			"gmail.com",
		)
		assert.NoError(t, err)

		assert.Equal(t, 1, len(result))
		assert.Equal(t, 2, len(result[0].Tasks))

		assert.Equal(t, t2.ID, result[0].Tasks[0].ID)
		assert.Equal(t, t1ID, result[0].Tasks[1].ID)

		updatedCalTask := getTaskForTest(t, taskCollection, c1.ID)
		assert.True(t, updatedCalTask.IsCompleted)
	})
	t.Run("ReorderingOldMoveUp", func(t *testing.T) {
		// Tested here: completed tasks cause reordered tasks to move up in list

		userID := primitive.NewObjectID()
		t1 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     1,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.io",
				Title:          "Code x",
				Source:         database.TaskSourceJIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID: "5",
			TaskNumber: 7,
		}
		t1Res, err := database.GetOrCreateTask(db, userID, "sample_task", database.TaskSourceJIRA, t1)
		assert.NoError(t, err)
		t1.ID = t1Res.ID

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:       2,
				HasBeenReordered: true,
				IDExternal:       "sample_task2",
				Deeplink:         "generaltask.io",
				Title:            "Code x",
				Source:           database.TaskSourceJIRA,
				TimeAllocation:   (time.Hour).Nanoseconds(),
				UserID:           userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			PriorityID: "3",
			TaskNumber: 12,
		}
		t2Res, err := database.GetOrCreateTask(db, userID, "sample_task2", database.TaskSourceJIRA, t2)
		assert.NoError(t, err)
		t2.ID = t2Res.ID

		e1ID := primitive.NewObjectID()
		e1 := database.Email{
			TaskBase: database.TaskBase{
				ID:             e1ID,
				IDExternal:     "sample_email",
				Deeplink:       "generaltask.io",
				Title:          "Respond to this email",
				Source:         database.TaskSourceGmail,
				TimeAllocation: (time.Minute * 5).Nanoseconds(),
			},
			SenderDomain: "gmail.com",
			TimeSent:     primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
		}

		priorityMapping := map[string]*map[string]int{
			"": {
				"3": 3,
				"5": 5,
			},
		}

		result, err := MergeTasks(
			db,
			&[]database.TaskBase{t1.TaskBase, t2.TaskBase},
			[]*database.CalendarEvent{},
			[]*database.Email{&e1},
			[]*database.Task{&t2},
			&priorityMapping,
			"gmail.com",
		)
		assert.NoError(t, err)

		assert.Equal(t, 1, len(result))
		assert.Equal(t, 2, len(result[0].Tasks))

		assert.Equal(t, t2.ID, result[0].Tasks[0].ID)
		assert.Equal(t, e1ID, result[0].Tasks[1].ID)
	})

	t.Run("FirstTaskPersists", func(t *testing.T) {
		userID := primitive.NewObjectID()
		t1 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     1,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.io",
				Title:          "Code x",
				Source:         database.TaskSourceJIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID: "5",
			TaskNumber: 1,
		}
		t1Res, err := database.GetOrCreateTask(db, userID, "sample_task", database.TaskSourceJIRA, t1)
		assert.NoError(t, err)
		t1.ID = t1Res.ID

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     2,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.io",
				Title:          "Code x",
				Source:         database.TaskSourceJIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID: "6",
			TaskNumber: 2,
		}
		t2Res, err := database.GetOrCreateTask(db, userID, "sample_task", database.TaskSourceJIRA, t2)
		assert.NoError(t, err)
		t2.ID = t2Res.ID

		t3 := database.Task{
			TaskBase: database.TaskBase{
				//0 ID ordering indicates new task.
				IDOrdering: 0,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.io",
				Title:          "Code x",
				Source:         database.TaskSourceJIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID: "2",
			TaskNumber: 3,
		}
		t3Res, err := database.GetOrCreateTask(db, userID, "sample_task", database.TaskSourceJIRA, t3)
		assert.NoError(t, err)
		t3.ID = t3Res.ID

		t4 := database.Task{
			TaskBase: database.TaskBase{
				//0 ID ordering indicates new task.
				IDOrdering: 0,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.io",
				Title:          "Code x",
				Source:         database.TaskSourceJIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID: "3",
			TaskNumber: 4,
		}
		t4Res, err := database.GetOrCreateTask(db, userID, "sample_task", database.TaskSourceJIRA, t4)
		assert.NoError(t, err)
		t4.ID = t4Res.ID

		priorityMapping := map[string]*map[string]int{
			"": {
				"2": 2,
				"3": 3,
				"5": 5,
				"6": 6,
			},
		}

		result, err := MergeTasks(
			db,
			&[]database.TaskBase{},
			[]*database.CalendarEvent{},
			[]*database.Email{},
			[]*database.Task{&t1, &t2, &t3, &t4},
			&priorityMapping,
			"gmail.com",
		)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(result))
		assert.Equal(t, 4, len(result[0].Tasks))
		assert.Equal(t, t1.ID, result[0].Tasks[0].ID)
		assert.Equal(t, t3.ID, result[0].Tasks[1].ID)
		assert.Equal(t, t4.ID, result[0].Tasks[2].ID)
		assert.Equal(t, t2.ID, result[0].Tasks[3].ID)
	})
}

func getTaskForTest(t *testing.T, taskCollection *mongo.Collection, taskID primitive.ObjectID) *database.TaskBase {
	var updatedTask database.TaskBase
	err := taskCollection.FindOne(context.TODO(), bson.M{"_id": taskID}).Decode(&updatedTask)
	assert.NoError(t, err)
	return &updatedTask
}
