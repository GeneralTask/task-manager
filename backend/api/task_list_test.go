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
	db, dbCleanup := database.GetDBConnection()
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
				Source:     database.TaskSourceGoogleCalendar.Name,
				Logo:       database.TaskSourceGoogleCalendar.Logo,
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
				Source:     database.TaskSourceGoogleCalendar.Name,
				Logo:       database.TaskSourceGoogleCalendar.Logo,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(time.Hour*3 + time.Minute*20)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 4)),
		}

		e1ID := primitive.NewObjectID()
		e1 := database.Email{
			TaskBase: database.TaskBase{
				ID:             e1ID,
				IDExternal:     "sample_email",
				Deeplink:       "generaltask.io",
				Title:          "Respond to this email",
				Source:         database.TaskSourceGmail.Name,
				Logo:           database.TaskSourceGmail.Logo,
				TimeAllocation: (time.Minute * 5).Nanoseconds(),
			},
			SenderDomain: "gmail.com",
			TimeSent:     primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
		}

		e2ID := primitive.NewObjectID()
		e2 := database.Email{
			TaskBase: database.TaskBase{
				ID:             e2ID,
				IDExternal:     "sample_email_2",
				Deeplink:       "generaltask.io",
				Title:          "Respond to this email...eventually",
				Source:         database.TaskSourceGmail.Name,
				Logo:           database.TaskSourceGmail.Logo,
				TimeAllocation: (time.Minute * 2).Nanoseconds(),
			},
			SenderDomain: "yahoo.com",
			TimeSent:     primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
		}

		t1ID := primitive.NewObjectID()
		t1 := database.Task{
			TaskBase: database.TaskBase{
				ID:             t1ID,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.io",
				Title:          "Code x",
				Source:         database.TaskSourceJIRA.Name,
				Logo:           database.TaskSourceJIRA.Logo,
				TimeAllocation: (time.Hour).Nanoseconds(),
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24)),
			Priority:   1,
			TaskNumber: 2,
		}

		t2ID := primitive.NewObjectID()
		t2 := database.Task{
			TaskBase: database.TaskBase{
				ID:             t2ID,
				IDExternal:     "sample_task1",
				Deeplink:       "generaltask.io",
				Title:          "Code x",
				Source:         database.TaskSourceJIRA.Name,
				Logo:           database.TaskSourceJIRA.Logo,
				TimeAllocation: (time.Hour).Nanoseconds(),
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			Priority:   3,
			TaskNumber: 12,
		}

		t3ID := primitive.NewObjectID()
		t3 := database.Task{
			TaskBase: database.TaskBase{
				ID:             t3ID,
				IDExternal:     "sample_task2",
				Deeplink:       "generaltask.io",
				Title:          "Code x",
				Source:         database.TaskSourceJIRA.Name,
				Logo:           database.TaskSourceJIRA.Logo,
				TimeAllocation: (time.Hour).Nanoseconds(),
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			Priority:   5,
			TaskNumber: 7,
		}

		t4ID := primitive.NewObjectID()
		t4 := database.Task{
			TaskBase: database.TaskBase{
				ID:             t4ID,
				IDExternal:     "sample_task3",
				Deeplink:       "generaltask.io",
				Title:          "Code x",
				Source:         database.TaskSourceJIRA.Name,
				Logo:           database.TaskSourceJIRA.Logo,
				TimeAllocation: (time.Hour).Nanoseconds(),
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			Priority:   3,
			TaskNumber: 1,
		}

		result := MergeTasks(
			db,
			&[]database.TaskBase{},
			[]*database.CalendarEvent{&c1, &c2},
			[]*database.Email{&e1, &e2},
			[]*database.Task{&t1, &t2, &t3, &t4},
			"gmail.com",
		)

		//need to improve these asserts to compare values as well but a pain with casting
		//for now so we'll compare JSON later.
		assert.Equal(t, len(result), 5)

		assert.Equal(t, 1, len(result[0].Tasks))
		assert.Equal(t, e1ID, result[0].Tasks[0].ID)
		assert.Equal(t, 1, result[0].Tasks[0].IDOrdering)

		assert.Equal(t, 1, len(result[1].Tasks))
		assert.Equal(t, c1ID, result[1].Tasks[0].ID)
		assert.Equal(t, 2, result[1].Tasks[0].IDOrdering)

		assert.Equal(t, 1, len(result[2].Tasks))
		assert.Equal(t, t1ID, result[2].Tasks[0].ID)
		assert.Equal(t, 3, result[2].Tasks[0].IDOrdering)

		assert.Equal(t, 1, len(result[3].Tasks))
		assert.Equal(t, c2ID, result[3].Tasks[0].ID)
		assert.Equal(t, 4, result[3].Tasks[0].IDOrdering)

		assert.Equal(t, 4, len(result[4].Tasks))
		assert.Equal(t, t3ID, result[4].Tasks[0].ID)
		assert.Equal(t, 5, result[4].Tasks[0].IDOrdering)

		assert.Equal(t, t4ID, result[4].Tasks[1].ID)
		assert.Equal(t, 6, result[4].Tasks[1].IDOrdering)

		assert.Equal(t, t2ID, result[4].Tasks[2].ID)
		assert.Equal(t, 7, result[4].Tasks[2].IDOrdering)

		assert.Equal(t, e2ID, result[4].Tasks[3].ID)
		assert.Equal(t, 8, result[4].Tasks[3].IDOrdering)
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
				Source:           database.TaskSourceJIRA.Name,
				Logo:             database.TaskSourceJIRA.Logo,
				TimeAllocation:   (time.Hour).Nanoseconds(),
				UserID:           userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			Priority:   5,
			TaskNumber: 7,
		}
		t1ID := database.GetOrCreateTask(db, userID, "sample_task", database.TaskSourceJIRA.Name, t1).ID
		t1.ID = t1ID

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:       5,
				HasBeenReordered: true,
				IDExternal:       "sample_task2",
				Deeplink:         "generaltask.io",
				Title:            "Code x",
				Source:           database.TaskSourceJIRA.Name,
				Logo:             database.TaskSourceJIRA.Logo,
				TimeAllocation:   (time.Hour).Nanoseconds(),
				UserID:           userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			Priority:   3,
			TaskNumber: 12,
		}
		t2ID := database.GetOrCreateTask(db, userID, "sample_task2", database.TaskSourceJIRA.Name, t2).ID
		t2.ID = t2ID

		c1 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering: 3,
				IDExternal: "standard_event",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     database.TaskSourceGoogleCalendar.Name,
				Logo:       database.TaskSourceGoogleCalendar.Logo,
				UserID:     userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(20 * time.Minute)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 2)),
		}
		c1ID := database.GetOrCreateTask(db, userID, "standard_event", database.TaskSourceGoogleCalendar.Name, c1).ID
		c1.ID = c1ID

		c2 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering: 4,
				IDExternal: "standard_event2",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     database.TaskSourceGoogleCalendar.Name,
				Logo:       database.TaskSourceGoogleCalendar.Logo,
				UserID:     userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 5)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 6)),
		}
		c2ID := database.GetOrCreateTask(db, userID, "standard_event2", database.TaskSourceGoogleCalendar.Name, c2).ID
		c2.ID = c2ID

		c3 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				// IDOrdering = 0 means cal event isn't included in reordering adjustments
				IDOrdering: 0,
				IDExternal: "standard_event3",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     database.TaskSourceGoogleCalendar.Name,
				Logo:       database.TaskSourceGoogleCalendar.Logo,
				UserID:     userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 7)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 8)),
		}
		c3ID := database.GetOrCreateTask(db, userID, "standard_event3", database.TaskSourceGoogleCalendar.Name, c3).ID
		c3.ID = c3ID

		result := MergeTasks(
			db,
			&[]database.TaskBase{c1.TaskBase, c2.TaskBase, c3.TaskBase, t1.TaskBase, t2.TaskBase},
			[]*database.CalendarEvent{&c1, &c2, &c3},
			[]*database.Email{},
			[]*database.Task{&t1, &t2},
			"gmail.com",
		)

		assert.Equal(t, 5, len(result))
		assert.Equal(t, t1ID, result[0].Tasks[0].ID)
		assert.Equal(t, 1, getTaskForTest(t, taskCollection, t1ID).IDOrdering)

		assert.Equal(t, c1ID, result[1].Tasks[0].ID)
		assert.Equal(t, 2, getTaskForTest(t, taskCollection, c1ID).IDOrdering)

		assert.Equal(t, c2ID, result[2].Tasks[0].ID)
		assert.Equal(t, 3, getTaskForTest(t, taskCollection, c2ID).IDOrdering)

		assert.Equal(t, t2ID, result[3].Tasks[0].ID)
		assert.Equal(t, 4, getTaskForTest(t, taskCollection, t2ID).IDOrdering)

		assert.Equal(t, c3ID, result[4].Tasks[0].ID)
		assert.Equal(t, 5, getTaskForTest(t, taskCollection, c3ID).IDOrdering)
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
				Source:         database.TaskSourceJIRA.Name,
				Logo:           database.TaskSourceJIRA.Logo,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			Priority:   5,
			TaskNumber: 7,
		}
		t1ID := database.GetOrCreateTask(db, userID, "sample_task", database.TaskSourceJIRA.Name, t1).ID
		t1.ID = t1ID

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     4,
				IDExternal:     "sample_task2",
				Deeplink:       "generaltask.io",
				Title:          "Code x",
				Source:         database.TaskSourceJIRA.Name,
				Logo:           database.TaskSourceJIRA.Logo,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			Priority:   3,
			TaskNumber: 12,
		}
		t2ID := database.GetOrCreateTask(db, userID, "sample_task2", database.TaskSourceJIRA.Name, t2).ID
		t2.ID = t2ID

		c1 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering: 3,
				IDExternal: "standard_event",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     database.TaskSourceGoogleCalendar.Name,
				Logo:       database.TaskSourceGoogleCalendar.Logo,
				UserID:     userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(20 * time.Minute)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 2)),
		}
		c1ID := database.GetOrCreateTask(db, userID, "standard_event", database.TaskSourceGoogleCalendar.Name, c1).ID
		c1.ID = c1ID

		c2 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering: 2,
				IDExternal: "standard_event2",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     database.TaskSourceGoogleCalendar.Name,
				Logo:       database.TaskSourceGoogleCalendar.Logo,
				UserID:     userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 5)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 6)),
		}
		c2ID := database.GetOrCreateTask(db, userID, "standard_event2", database.TaskSourceGoogleCalendar.Name, c2).ID
		c2.ID = c2ID
		result := MergeTasks(
			db,
			&[]database.TaskBase{c1.TaskBase, c2.TaskBase, t1.TaskBase, t2.TaskBase},
			[]*database.CalendarEvent{&c1, &c2},
			[]*database.Email{},
			[]*database.Task{&t1, &t2},
			"gmail.com",
		)

		assert.Equal(t, 3, len(result))
		assert.Equal(t, 1, len(result[0].Tasks))
		assert.Equal(t, 2, len(result[1].Tasks))
		assert.Equal(t, 1, len(result[2].Tasks))

		assert.Equal(t, c1ID, result[0].Tasks[0].ID)
		assert.Equal(t, t1ID, result[1].Tasks[0].ID)
		assert.Equal(t, t2ID, result[1].Tasks[1].ID)
		assert.Equal(t, c2ID, result[2].Tasks[0].ID)
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
				Source:         database.TaskSourceJIRA.Name,
				Logo:           database.TaskSourceJIRA.Logo,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 1)),
			Priority:   1,
			TaskNumber: 7,
		}

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:       4,
				HasBeenReordered: true,
				IDExternal:       "sample_task2",
				Deeplink:         "generaltask.io",
				Title:            "Code x",
				Source:           database.TaskSourceJIRA.Name,
				Logo:             database.TaskSourceJIRA.Logo,
				TimeAllocation:   (time.Hour).Nanoseconds(),
				UserID:           userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			Priority:   3,
			TaskNumber: 12,
		}
		t2ID := database.GetOrCreateTask(db, userID, "sample_task2", database.TaskSourceJIRA.Name, t2).ID
		t2.ID = t2ID

		c1 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering: 3,
				IDExternal: "standard_event",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     database.TaskSourceGoogleCalendar.Name,
				Logo:       database.TaskSourceGoogleCalendar.Logo,
				UserID:     userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(20 * time.Minute)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 2)),
		}
		c1ID := database.GetOrCreateTask(db, userID, "standard_event", database.TaskSourceGoogleCalendar.Name, c1).ID
		c1.ID = c1ID

		result := MergeTasks(
			db,
			&[]database.TaskBase{c1.TaskBase, t2.TaskBase},
			[]*database.CalendarEvent{},
			[]*database.Email{},
			[]*database.Task{&t1, &t2},
			"gmail.com",
		)

		assert.Equal(t, 1, len(result))
		assert.Equal(t, 2, len(result[0].Tasks))

		assert.Equal(t, t2ID, result[0].Tasks[0].ID)
		assert.Equal(t, t1ID, result[0].Tasks[1].ID)

		updatedCalTask := getTaskForTest(t, taskCollection, c1ID)
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
				Source:         database.TaskSourceJIRA.Name,
				Logo:           database.TaskSourceJIRA.Logo,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			Priority:   5,
			TaskNumber: 7,
		}
		t1ID := database.GetOrCreateTask(db, userID, "sample_task", database.TaskSourceJIRA.Name, t1).ID
		t1.ID = t1ID

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:       2,
				HasBeenReordered: true,
				IDExternal:       "sample_task2",
				Deeplink:         "generaltask.io",
				Title:            "Code x",
				Source:           database.TaskSourceJIRA.Name,
				Logo:             database.TaskSourceJIRA.Logo,
				TimeAllocation:   (time.Hour).Nanoseconds(),
				UserID:           userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			Priority:   3,
			TaskNumber: 12,
		}
		t2ID := database.GetOrCreateTask(db, userID, "sample_task2", database.TaskSourceJIRA.Name, t2).ID
		t2.ID = t2ID

		e1ID := primitive.NewObjectID()
		e1 := database.Email{
			TaskBase: database.TaskBase{
				ID:             e1ID,
				IDExternal:     "sample_email",
				Deeplink:       "generaltask.io",
				Title:          "Respond to this email",
				Source:         database.TaskSourceGmail.Name,
				Logo:           database.TaskSourceGmail.Logo,
				TimeAllocation: (time.Minute * 5).Nanoseconds(),
			},
			SenderDomain: "gmail.com",
			TimeSent:     primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
		}

		result := MergeTasks(
			db,
			&[]database.TaskBase{t1.TaskBase, t2.TaskBase},
			[]*database.CalendarEvent{},
			[]*database.Email{&e1},
			[]*database.Task{&t2},
			"gmail.com",
		)

		assert.Equal(t, 1, len(result))
		assert.Equal(t, 2, len(result[0].Tasks))

		assert.Equal(t, t2ID, result[0].Tasks[0].ID)
		assert.Equal(t, e1ID, result[0].Tasks[1].ID)
	})
}

func getTaskForTest(t *testing.T, taskCollection *mongo.Collection, taskID primitive.ObjectID) *database.TaskBase {
	var updatedTask database.TaskBase
	err := taskCollection.FindOne(context.TODO(), bson.M{"_id": taskID}).Decode(&updatedTask)
	assert.NoError(t, err)
	return &updatedTask
}
