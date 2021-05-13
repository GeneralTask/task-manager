package api

import (
	"testing"
	"time"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestMergeTasks(t *testing.T) {
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
				IDExternal:     "sample_task",
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
				IDExternal:     "sample_task",
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
				IDExternal:     "sample_task",
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
			[]*database.CalendarEvent{&c1, &c2},
			[]*database.Email{&e1, &e2},
			[]*database.Task{&t1, &t2, &t3, &t4},
			"gmail.com")

		//need to improve these asserts to compare values as well but a pain with casting
		//for now so we'll compare JSON later.
		assert.Equal(t, len(result), 5)

		assert.Equal(t, 1, len(result[0].Tasks))
		assert.Equal(t, e1ID, result[0].Tasks[0].ID)

		assert.Equal(t, 1, len(result[1].Tasks))
		assert.Equal(t, c1ID, result[1].Tasks[0].ID)

		assert.Equal(t, 1, len(result[2].Tasks))
		assert.Equal(t, t1ID, result[2].Tasks[0].ID)

		assert.Equal(t, 1, len(result[3].Tasks))
		assert.Equal(t, c2ID, result[3].Tasks[0].ID)

		assert.Equal(t, 4, len(result[4].Tasks))
		assert.Equal(t, t3ID, result[4].Tasks[0].ID)
		assert.Equal(t, t4ID, result[4].Tasks[1].ID)
		assert.Equal(t, t2ID, result[4].Tasks[2].ID)
		assert.Equal(t, e2ID, result[4].Tasks[3].ID)
	})
}