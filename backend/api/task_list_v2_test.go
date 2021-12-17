package api

import (
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/settings"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestMergeTasksV2V2(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	t.Run("SimpleMerge", func(t *testing.T) {
		e1ID := primitive.NewObjectID()
		e1 := database.Email{
			TaskBase: database.TaskBase{
				ID:                e1ID,
				IDExternal:        "sample_email",
				Deeplink:          "generaltask.com",
				Title:             "Respond to this email",
				SourceID:          external.TASK_SOURCE_ID_GMAIL,
				TimeAllocation:    (time.Minute * 5).Nanoseconds(),
				SourceAccountID:   "elon@gmail.com",
				CreatedAtExternal: primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
			},
			SenderDomain: "gmail.com",
		}
		e1aID := primitive.NewObjectID()
		e1a := database.Email{
			TaskBase: database.TaskBase{
				ID:                e1aID,
				IDExternal:        "sample_emailA",
				Deeplink:          "generaltask.com",
				Title:             "Respond to this email",
				SourceID:          external.TASK_SOURCE_ID_GMAIL,
				TimeAllocation:    (time.Minute * 5).Nanoseconds(),
				SourceAccountID:   "elon@moon.com",
				CreatedAtExternal: primitive.NewDateTimeFromTime(time.Now().Add(-time.Minute)),
			},
			SenderDomain: "moon.com",
		}

		e2ID := primitive.NewObjectID()
		e2 := database.Email{
			TaskBase: database.TaskBase{
				ID:                e2ID,
				IDExternal:        "sample_email_2",
				Deeplink:          "generaltask.com",
				Title:             "Respond to this email...eventually",
				SourceID:          external.TASK_SOURCE_ID_GMAIL,
				TimeAllocation:    (time.Minute * 2).Nanoseconds(),
				SourceAccountID:   "elon@gmail.com",
				CreatedAtExternal: primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
			},
			SenderDomain: "yahoo.com",
		}

		t1ID := primitive.NewObjectID()
		t1 := database.Task{
			TaskBase: database.TaskBase{
				ID:              t1ID,
				IDExternal:      "sample_task",
				Deeplink:        "generaltask.com",
				Title:           "Code x",
				SourceID:        external.TASK_SOURCE_ID_JIRA,
				TimeAllocation:  (time.Hour).Nanoseconds(),
				SourceAccountID: "AtlassianSite2",
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24)),
			PriorityID:         "5",
			PriorityNormalized: 1.0,
			TaskNumber:         2,
		}

		t2ID := primitive.NewObjectID()
		t2 := database.Task{
			TaskBase: database.TaskBase{
				ID:              t2ID,
				IDExternal:      "sample_task1",
				Deeplink:        "generaltask.com",
				Title:           "Code x",
				SourceID:        external.TASK_SOURCE_ID_JIRA,
				TimeAllocation:  (time.Hour).Nanoseconds(),
				SourceAccountID: "AtlassianSite1",
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			PriorityID:         "3",
			PriorityNormalized: 1.0,
			TaskNumber:         12,
		}

		t3ID := primitive.NewObjectID()
		t3 := database.Task{
			TaskBase: database.TaskBase{
				ID:              t3ID,
				IDExternal:      "sample_task2",
				Deeplink:        "generaltask.com",
				Title:           "Code x",
				SourceID:        external.TASK_SOURCE_ID_JIRA,
				TimeAllocation:  (time.Hour).Nanoseconds(),
				SourceAccountID: "AtlassianSite1",
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID:         "1",
			PriorityNormalized: 0.0,
			TaskNumber:         7,
		}

		t4ID := primitive.NewObjectID()
		t4 := database.Task{
			TaskBase: database.TaskBase{
				ID:              t4ID,
				IDExternal:      "sample_task3",
				Deeplink:        "generaltask.com",
				Title:           "Code x",
				SourceID:        external.TASK_SOURCE_ID_JIRA,
				TimeAllocation:  (time.Hour).Nanoseconds(),
				SourceAccountID: "AtlassianSite1",
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID:         "3",
			PriorityNormalized: 1.0,
			TaskNumber:         1,
		}

		result, err := MergeTasksV2(
			db,
			&[]database.TaskBase{},
			[]*database.Email{&e1, &e1a, &e2},
			[]*database.Task{&t1, &t2, &t3, &t4},
			primitive.NewObjectID(),
		)
		assert.NoError(t, err)

		//need to improve these asserts to compare values as well but a pain with casting
		//for now so we'll compare JSON later.
		assert.Equal(t, 3, len(result))
		assert.Equal(t, 5, len(result[0].Tasks))
	})
	t.Run("ReorderingPersist", func(t *testing.T) {
		// Tested here: existing DB ordering IDs are kept (except cal events)

		userID := primitive.NewObjectID()
		t1 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     1,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.com",
				Title:          "Code x",
				SourceID:       external.TASK_SOURCE_ID_JIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID:         "5",
			PriorityNormalized: 1.0,
			TaskNumber:         7,
		}
		t1Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t1)
		assert.NoError(t, err)
		t1.ID = t1Res.ID

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     4,
				IDExternal:     "sample_task2",
				Deeplink:       "generaltask.com",
				Title:          "Code x",
				SourceID:       external.TASK_SOURCE_ID_JIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			PriorityID:         "3",
			PriorityNormalized: 0.0,
			TaskNumber:         12,
		}
		t2Res, err := database.GetOrCreateTask(db, userID, "sample_task2", external.TASK_SOURCE_ID_JIRA, t2)
		assert.NoError(t, err)
		t2.ID = t2Res.ID

		result, err := MergeTasksV2(
			db,
			&[]database.TaskBase{t1.TaskBase, t2.TaskBase},
			[]*database.Email{},
			[]*database.Task{&t1, &t2},
			userID,
		)
		assert.NoError(t, err)

		assert.Equal(t, 3, len(result))
		assert.Equal(t, 5, len(result[0].Tasks))
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
				Deeplink:       "generaltask.com",
				Title:          "Code x",
				SourceID:       external.TASK_SOURCE_ID_JIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 1)),
			PriorityID:         "1",
			PriorityNormalized: 0.0,
			TaskNumber:         7,
		}

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:       4,
				HasBeenReordered: true,
				IDExternal:       "sample_task2",
				Deeplink:         "generaltask.com",
				Title:            "Code x",
				SourceID:         external.TASK_SOURCE_ID_JIRA,
				TimeAllocation:   (time.Hour).Nanoseconds(),
				UserID:           userID,
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			PriorityID:         "3",
			PriorityNormalized: 1.0,
			TaskNumber:         12,
		}
		t2Res, err := database.GetOrCreateTask(db, userID, "sample_task2", external.TASK_SOURCE_ID_JIRA, t2)
		assert.NoError(t, err)
		t2.ID = t2Res.ID

		c1 := database.CalendarEvent{
			TaskBase: database.TaskBase{
				IDOrdering: 3,
				IDExternal: "standard_event",
				Deeplink:   "generaltask.com",
				Title:      "Standard Event",
				SourceID:   external.TASK_SOURCE_ID_GCAL,
				UserID:     userID,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(20 * time.Minute)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 2)),
		}
		c1Res, err := database.GetOrCreateTask(db, userID, "standard_event", external.TASK_SOURCE_ID_GCAL, c1)
		assert.NoError(t, err)
		c1.ID = c1Res.ID

		result, err := MergeTasksV2(
			db,
			&[]database.TaskBase{c1.TaskBase, t2.TaskBase},
			[]*database.Email{},
			[]*database.Task{&t1, &t2},
			userID,
		)
		assert.NoError(t, err)

		assert.Equal(t, 3, len(result))
		assert.Equal(t, 5, len(result[0].Tasks))
	})
	t.Run("ReorderingOldMoveUp", func(t *testing.T) {
		// Tested here: completed tasks cause reordered tasks to move up in list

		userID := primitive.NewObjectID()
		t1 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     1,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.com",
				Title:          "Code x",
				SourceID:       external.TASK_SOURCE_ID_JIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID:         "5",
			PriorityNormalized: 0.5,
			TaskNumber:         7,
		}
		t1Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t1)
		assert.NoError(t, err)
		t1.ID = t1Res.ID

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:       2,
				HasBeenReordered: true,
				IDExternal:       "sample_task2",
				Deeplink:         "generaltask.com",
				Title:            "Code x",
				SourceID:         external.TASK_SOURCE_ID_JIRA,
				TimeAllocation:   (time.Hour).Nanoseconds(),
				UserID:           userID,
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			PriorityID:         "3",
			PriorityNormalized: 0.0,
			TaskNumber:         12,
		}
		t2Res, err := database.GetOrCreateTask(db, userID, "sample_task2", external.TASK_SOURCE_ID_JIRA, t2)
		assert.NoError(t, err)
		t2.ID = t2Res.ID

		e1ID := primitive.NewObjectID()
		e1 := database.Email{
			TaskBase: database.TaskBase{
				ID:                e1ID,
				IDExternal:        "sample_email",
				Deeplink:          "generaltask.com",
				Title:             "Respond to this email",
				SourceID:          external.TASK_SOURCE_ID_GMAIL,
				TimeAllocation:    (time.Minute * 5).Nanoseconds(),
				CreatedAtExternal: primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
			},
			SenderDomain: "gmail.com",
		}

		result, err := MergeTasksV2(
			db,
			&[]database.TaskBase{t1.TaskBase, t2.TaskBase},
			[]*database.Email{&e1},
			[]*database.Task{&t2},
			userID,
		)
		assert.NoError(t, err)

		assert.Equal(t, 3, len(result))
		assert.Equal(t, 5, len(result[0].Tasks))
	})

	t.Run("FirstTaskPersists", func(t *testing.T) {
		userID := primitive.NewObjectID()
		t1 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     1,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.com",
				Title:          "Code x",
				SourceID:       external.TASK_SOURCE_ID_JIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID:         "5",
			PriorityNormalized: 0.5,
			TaskNumber:         1,
		}
		t1Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t1)
		assert.NoError(t, err)
		t1.ID = t1Res.ID

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     2,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.com",
				Title:          "Code x",
				SourceID:       external.TASK_SOURCE_ID_JIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID:         "6",
			PriorityNormalized: 0.75,
			TaskNumber:         2,
		}
		t2Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t2)
		assert.NoError(t, err)
		t2.ID = t2Res.ID

		t3 := database.Task{
			TaskBase: database.TaskBase{
				//0 ID ordering indicates new task.
				IDOrdering:     0,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.com",
				Title:          "Code x",
				SourceID:       external.TASK_SOURCE_ID_JIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID: "2",
			TaskNumber: 3,
		}
		t3Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t3)
		assert.NoError(t, err)
		t3.ID = t3Res.ID

		t4 := database.Task{
			TaskBase: database.TaskBase{
				//0 ID ordering indicates new task.
				IDOrdering:     0,
				IDExternal:     "sample_task",
				Deeplink:       "generaltask.com",
				Title:          "Code x",
				SourceID:       external.TASK_SOURCE_ID_JIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID: "3",
			TaskNumber: 4,
		}
		t4Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t4)
		assert.NoError(t, err)
		t4.ID = t4Res.ID

		result, err := MergeTasksV2(
			db,
			&[]database.TaskBase{},
			[]*database.Email{},
			[]*database.Task{&t1, &t2, &t3, &t4},
			userID,
		)
		assert.NoError(t, err)

		assert.Equal(t, 3, len(result))
		assert.Equal(t, 5, len(result[0].Tasks))
	})
	t.Run("SectionTasksStay", func(t *testing.T) {
		userID := primitive.NewObjectID()
		t1 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     2,
				IDExternal:     "sample_task",
				IDTaskSection:  constants.IDTaskSectionBlocked,
				Deeplink:       "generaltask.com",
				Title:          "Code x",
				SourceID:       external.TASK_SOURCE_ID_JIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID:         "5",
			PriorityNormalized: 0.5,
			TaskNumber:         7,
		}
		t1Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t1)
		assert.NoError(t, err)
		t1.ID = t1Res.ID

		t2 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     1,
				IDExternal:     "sample_task2",
				IDTaskSection:  constants.IDTaskSectionBlocked,
				Deeplink:       "generaltask.com",
				Title:          "Code x",
				SourceID:       external.TASK_SOURCE_ID_JIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			PriorityID:         "3",
			PriorityNormalized: 0.0,
			TaskNumber:         12,
		}
		t2Res, err := database.GetOrCreateTask(db, userID, "sample_task2", external.TASK_SOURCE_ID_JIRA, t2)
		assert.NoError(t, err)
		t2.ID = t2Res.ID

		t3 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     2,
				IDExternal:     "sample_task",
				IDTaskSection:  constants.IDTaskSectionBacklog,
				Deeplink:       "generaltask.com",
				Title:          "Code x",
				SourceID:       external.TASK_SOURCE_ID_JIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			PriorityID:         "5",
			PriorityNormalized: 0.5,
			TaskNumber:         7,
		}
		t3Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t3)
		assert.NoError(t, err)
		t3.ID = t3Res.ID

		t4 := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:     1,
				IDExternal:     "sample_task2",
				IDTaskSection:  constants.IDTaskSectionBacklog,
				Deeplink:       "generaltask.com",
				Title:          "Code x",
				SourceID:       external.TASK_SOURCE_ID_JIRA,
				TimeAllocation: (time.Hour).Nanoseconds(),
				UserID:         userID,
			},
			DueDate:            primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			PriorityID:         "3",
			PriorityNormalized: 0.0,
			TaskNumber:         12,
		}
		t4Res, err := database.GetOrCreateTask(db, userID, "sample_task2", external.TASK_SOURCE_ID_JIRA, t4)
		assert.NoError(t, err)
		t4.ID = t4Res.ID

		result, err := MergeTasksV2(
			db,
			&[]database.TaskBase{t1.TaskBase, t2.TaskBase},
			[]*database.Email{},
			[]*database.Task{&t1, &t2},
			userID,
		)
		assert.NoError(t, err)

		assert.Equal(t, 3, len(result))
		assert.Equal(t, 5, len(result[0].Tasks))
	})
	t.Run("EmailOrderingOldestFirst", func(t *testing.T) {
		userID := primitive.NewObjectID()
		e1ID := primitive.NewObjectID()
		e1 := database.Email{
			TaskBase: database.TaskBase{
				ID:                e1ID,
				IDExternal:        "sample_email",
				Deeplink:          "generaltask.com",
				Title:             "Respond to this email",
				SourceID:          external.TASK_SOURCE_ID_GMAIL,
				TimeAllocation:    (time.Minute * 5).Nanoseconds(),
				CreatedAtExternal: primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
			},
			SenderDomain: "gmail.com",
		}

		e2ID := primitive.NewObjectID()
		e2 := database.Email{
			TaskBase: database.TaskBase{
				ID:                e2ID,
				IDExternal:        "sample_email",
				Deeplink:          "generaltask.com",
				Title:             "Respond to this email but sent more recently",
				SourceID:          external.TASK_SOURCE_ID_GMAIL,
				TimeAllocation:    (time.Minute * 5).Nanoseconds(),
				CreatedAtExternal: primitive.NewDateTimeFromTime(time.Now().Add(-time.Minute)),
			},
			SenderDomain: "gmail.com",
		}

		err := settings.UpdateUserSetting(
			db,
			userID,
			settings.SettingFieldEmailOrderingPreference,
			settings.ChoiceKeyOldestFirst,
		)
		assert.NoError(t, err)

		result, err := MergeTasksV2(
			db,
			&[]database.TaskBase{e1.TaskBase, e2.TaskBase},
			[]*database.Email{&e1, &e2},
			[]*database.Task{},
			userID,
		)
		assert.NoError(t, err)

		assert.Equal(t, 3, len(result))
		assert.Equal(t, 5, len(result[0].Tasks))
	})
}
