package api

import (
	// "fmt"
	"fmt"
	"testing"
	"time"

	// "github.com/GeneralTask/task-manager/backend/constants"
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

	// t.Run("SimpleMerge", func(t *testing.T) {
	// 	e1ID := primitive.NewObjectID()
	// 	e1 := database.TaskRecord{
	// 		TaskBase: database.TaskBase{
	// 			ID:                e1ID,
	// 			IDExternal:        "sample_email",
	// 			Deeplink:          "generaltask.com",
	// 			Title:             "Respond to this email",
	// 			SourceID:          external.TASK_SOURCE_ID_GMAIL,
	// 			TimeAllocation:    (time.Minute * 5).Nanoseconds(),
	// 			SourceAccountID:   "elon@gmail.com",
	// 			CreatedAtExternal: primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
	// 		},
	// 		Email: database.Email{

	// 			SenderDomain: "gmail.com",
	// 		},
	// 	}

	// 	e1aID := primitive.NewObjectID()
	// 	e1a := database.TaskRecord{
	// 		TaskBase: database.TaskBase{
	// 			ID:                e1aID,
	// 			IDExternal:        "sample_emailA",
	// 			Deeplink:          "generaltask.com",
	// 			Title:             "Respond to this email",
	// 			SourceID:          external.TASK_SOURCE_ID_GMAIL,
	// 			TimeAllocation:    (time.Minute * 5).Nanoseconds(),
	// 			SourceAccountID:   "elon@moon.com",
	// 			CreatedAtExternal: primitive.NewDateTimeFromTime(time.Now().Add(-time.Minute)),
	// 		},
	// 		Email: database.Email{

	// 			SenderDomain: "moon.com",
	// 		},
	// 	}

	// 	e2ID := primitive.NewObjectID()
	// 	e2 := database.TaskRecord{
	// 		TaskBase: database.TaskBase{
	// 			ID:                e2ID,
	// 			IDExternal:        "sample_email_2",
	// 			Deeplink:          "generaltask.com",
	// 			Title:             "Respond to this email...eventually",
	// 			SourceID:          external.TASK_SOURCE_ID_GMAIL,
	// 			TimeAllocation:    (time.Minute * 2).Nanoseconds(),
	// 			SourceAccountID:   "elon@gmail.com",
	// 			CreatedAtExternal: primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
	// 		},
	// 		Email: database.Email{
	// 			SenderDomain: "yahoo.com",
	// 		},
	// 	}

	// 	t1ID := primitive.NewObjectID()
	// 	t1 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			ID:              t1ID,
	// 			IDExternal:      "sample_task",
	// 			Deeplink:        "generaltask.com",
	// 			Title:           "Code x",
	// 			SourceID:        external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation:  (time.Hour).Nanoseconds(),
	// 			SourceAccountID: "AtlassianSite2",
	// 			DueDate:         primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24)),
	// 		},
	// 		PriorityID:         "5",
	// 		PriorityNormalized: 1.0,
	// 		TaskNumber:         2,
	// 	}

	// 	t2ID := primitive.NewObjectID()
	// 	t2 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			ID:              t2ID,
	// 			IDExternal:      "sample_task1",
	// 			Deeplink:        "generaltask.com",
	// 			Title:           "Code x",
	// 			SourceID:        external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation:  (time.Hour).Nanoseconds(),
	// 			SourceAccountID: "AtlassianSite1",
	// 			DueDate:         primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
	// 		},
	// 		PriorityID:         "3",
	// 		PriorityNormalized: 1.0,
	// 		TaskNumber:         12,
	// 	}

	// 	t3ID := primitive.NewObjectID()
	// 	t3 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			ID:              t3ID,
	// 			IDExternal:      "sample_task2",
	// 			Deeplink:        "generaltask.com",
	// 			Title:           "Code x",
	// 			SourceID:        external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation:  (time.Hour).Nanoseconds(),
	// 			SourceAccountID: "AtlassianSite1",
	// 			DueDate:         primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
	// 		},
	// 		PriorityID:         "1",
	// 		PriorityNormalized: 0.0,
	// 		TaskNumber:         7,
	// 	}

	// 	t4ID := primitive.NewObjectID()
	// 	t4 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			ID:              t4ID,
	// 			IDExternal:      "sample_task3",
	// 			Deeplink:        "generaltask.com",
	// 			Title:           "Code x",
	// 			SourceID:        external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation:  (time.Hour).Nanoseconds(),
	// 			SourceAccountID: "AtlassianSite1",
	// 			DueDate:         primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
	// 		},
	// 		PriorityID:         "3",
	// 		PriorityNormalized: 1.0,
	// 		TaskNumber:         1,
	// 	}

	// 	result, err := MergeTasksV2(
	// 		db,
	// 		&[]database.TaskBase{},
	// 		[]*database.TaskRecord{&e1, &e1a, &e2},
	// 		[]*database.Task{&t1, &t2, &t3, &t4},
	// 		primitive.NewObjectID(),
	// 	)
	// 	assert.NoError(t, err)

	// 	//need to improve these asserts to compare values as well but a pain with casting
	// 	//for now so we'll compare JSON later.
	// 	assert.Equal(t, 3, len(result))
	// 	assert.Equal(t, 7, len(result[0].Tasks))
	// 	todayTasks := result[0].Tasks
	// 	fmt.Println("task ids", e1ID, e1aID, e2ID, t1ID, t2ID, t3ID, t4ID)
	// 	fmt.Println("jerd", e1aID)
	// 	fmt.Println("jerd", e1a)
	// 	fmt.Println("jerd", *todayTasks[0])
	// 	assert.Equal(t, e1aID, todayTasks[0].ID)
	// 	assert.Equal(t, e1ID, todayTasks[1].ID)
	// 	assert.Equal(t, t1ID, todayTasks[2].ID)
	// 	assert.Equal(t, t3ID, todayTasks[3].ID)
	// 	assert.Equal(t, t4ID, todayTasks[4].ID)
	// 	assert.Equal(t, t2ID, todayTasks[5].ID)
	// 	assert.Equal(t, e2ID, todayTasks[6].ID)
	// })
	// t.Run("ReorderingPersist", func(t *testing.T) {
	// 	// Tested here: existing DB ordering IDs are kept (except cal events)

	// 	userID := primitive.NewObjectID()
	// 	t1 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			IDOrdering:     1,
	// 			IDExternal:     "sample_task",
	// 			Deeplink:       "generaltask.com",
	// 			Title:          "Code x",
	// 			SourceID:       external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation: (time.Hour).Nanoseconds(),
	// 			UserID:         userID,
	// 			DueDate:        primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
	// 		},
	// 		PriorityID:         "5",
	// 		PriorityNormalized: 1.0,
	// 		TaskNumber:         7,
	// 	}
	// 	t1Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t1)
	// 	assert.NoError(t, err)
	// 	t1.ID = t1Res.ID

	// 	t2 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			IDOrdering:     4,
	// 			IDExternal:     "sample_task2",
	// 			Deeplink:       "generaltask.com",
	// 			Title:          "Code x",
	// 			SourceID:       external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation: (time.Hour).Nanoseconds(),
	// 			UserID:         userID,
	// 			DueDate:        primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
	// 		},
	// 		PriorityID:         "3",
	// 		PriorityNormalized: 0.0,
	// 		TaskNumber:         12,
	// 	}
	// 	t2Res, err := database.GetOrCreateTask(db, userID, "sample_task2", external.TASK_SOURCE_ID_JIRA, t2)
	// 	assert.NoError(t, err)
	// 	t2.ID = t2Res.ID

	// 	result, err := MergeTasksV2(
	// 		db,
	// 		&[]database.TaskBase{t1.TaskBase, t2.TaskBase},
	// 		[]*database.TaskRecord{},
	// 		[]*database.Task{&t1, &t2},
	// 		userID,
	// 	)
	// 	assert.NoError(t, err)

	// 	assert.Equal(t, 3, len(result))
	// 	assert.Equal(t, 2, len(result[0].Tasks))
	// 	todayTasks := result[0].Tasks
	// 	assert.Equal(t, t1.ID, todayTasks[0].ID)
	// 	assert.Equal(t, t2.ID, todayTasks[1].ID)
	// })
	// t.Run("ReorderingOldNew", func(t *testing.T) {
	// 	// Tested here:
	// 	// 1) new tasks are inserted ignoring reordered tasks
	// 	// 2) completed tasks are marked such in the db
	// 	// TODO next:
	// 	// 3) completed tasks cause reordered tasks to move up in list

	// 	userID := primitive.NewObjectID()
	// 	t1ID := primitive.NewObjectID()
	// 	t1 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			ID:             t1ID,
	// 			IDExternal:     "sample_task",
	// 			Deeplink:       "generaltask.com",
	// 			Title:          "Code x",
	// 			SourceID:       external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation: (time.Hour).Nanoseconds(),
	// 			UserID:         userID,
	// 			DueDate:        primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 1)),
	// 		},
	// 		PriorityID:         "1",
	// 		PriorityNormalized: 0.0,
	// 		TaskNumber:         7,
	// 	}

	// 	t2 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			IDOrdering:       4,
	// 			HasBeenReordered: true,
	// 			IDExternal:       "sample_task2",
	// 			Deeplink:         "generaltask.com",
	// 			Title:            "Code x",
	// 			SourceID:         external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation:   (time.Hour).Nanoseconds(),
	// 			UserID:           userID,
	// 			DueDate:          primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
	// 		},
	// 		PriorityID:         "3",
	// 		PriorityNormalized: 1.0,
	// 		TaskNumber:         12,
	// 	}
	// 	t2Res, err := database.GetOrCreateTask(db, userID, "sample_task2", external.TASK_SOURCE_ID_JIRA, t2)
	// 	assert.NoError(t, err)
	// 	t2.ID = t2Res.ID

	// 	result, err := MergeTasksV2(
	// 		db,
	// 		&[]database.TaskBase{t2.TaskBase},
	// 		[]*database.TaskRecord{},
	// 		[]*database.Task{&t1, &t2},
	// 		userID,
	// 	)
	// 	assert.NoError(t, err)

	// 	assert.Equal(t, 3, len(result))
	// 	assert.Equal(t, 2, len(result[0].Tasks))
	// 	todayTasks := result[0].Tasks
	// 	assert.Equal(t, t1.ID, todayTasks[0].ID)
	// 	assert.Equal(t, t2.ID, todayTasks[1].ID)
	// })
	// t.Run("ReorderingOldMoveUp", func(t *testing.T) {
	// 	// Tested here: completed tasks cause reordered tasks to move up in list

	// 	userID := primitive.NewObjectID()
	// 	t1 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			IDOrdering:     1,
	// 			IDExternal:     "sample_task",
	// 			Deeplink:       "generaltask.com",
	// 			Title:          "Code x",
	// 			SourceID:       external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation: (time.Hour).Nanoseconds(),
	// 			UserID:         userID,
	// 			DueDate:        primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
	// 		},
	// 		PriorityID:         "5",
	// 		PriorityNormalized: 0.5,
	// 		TaskNumber:         7,
	// 	}
	// 	t1Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t1)
	// 	assert.NoError(t, err)
	// 	t1.ID = t1Res.ID

	// 	t2 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			IDOrdering:       2,
	// 			HasBeenReordered: true,
	// 			IDExternal:       "sample_task2",
	// 			Deeplink:         "generaltask.com",
	// 			Title:            "Code x",
	// 			SourceID:         external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation:   (time.Hour).Nanoseconds(),
	// 			UserID:           userID,
	// 			DueDate:          primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
	// 		},
	// 		PriorityID:         "3",
	// 		PriorityNormalized: 0.0,
	// 		TaskNumber:         12,
	// 	}
	// 	t2Res, err := database.GetOrCreateTask(db, userID, "sample_task2", external.TASK_SOURCE_ID_JIRA, t2)
	// 	assert.NoError(t, err)
	// 	t2.ID = t2Res.ID

	// 	e1ID := primitive.NewObjectID()
	// 	e1 := database.TaskRecord{
	// 		TaskBase: database.TaskBase{
	// 			ID:                e1ID,
	// 			IDExternal:        "sample_email",
	// 			Deeplink:          "generaltask.com",
	// 			Title:             "Respond to this email",
	// 			SourceID:          external.TASK_SOURCE_ID_GMAIL,
	// 			TimeAllocation:    (time.Minute * 5).Nanoseconds(),
	// 			CreatedAtExternal: primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
	// 		},
	// 		Email: database.Email{

	// 			SenderDomain: "gmail.com",
	// 		},
	// 	}

	// 	result, err := MergeTasksV2(
	// 		db,
	// 		&[]database.TaskBase{t1.TaskBase, t2.TaskBase},
	// 		[]*database.TaskRecord{&e1},
	// 		[]*database.Task{&t2},
	// 		userID,
	// 	)
	// 	assert.NoError(t, err)

	// 	assert.Equal(t, 3, len(result))
	// 	assert.Equal(t, 2, len(result[0].Tasks))
	// 	todayTasks := result[0].Tasks
	// 	assert.Equal(t, t2.ID, todayTasks[0].ID)
	// 	assert.Equal(t, e1.ID, todayTasks[1].ID)
	// })

	// t.Run("FirstTaskPersists", func(t *testing.T) {
	// 	userID := primitive.NewObjectID()
	// 	t1 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			IDOrdering:     1,
	// 			IDExternal:     "sample_task",
	// 			Deeplink:       "generaltask.com",
	// 			Title:          "Code x",
	// 			SourceID:       external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation: (time.Hour).Nanoseconds(),
	// 			UserID:         userID,
	// 			DueDate:        primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
	// 		},
	// 		PriorityID:         "5",
	// 		PriorityNormalized: 0.5,
	// 		TaskNumber:         1,
	// 	}
	// 	t1Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t1)
	// 	assert.NoError(t, err)
	// 	t1.ID = t1Res.ID

	// 	t2 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			IDOrdering:     2,
	// 			IDExternal:     "sample_task",
	// 			Deeplink:       "generaltask.com",
	// 			Title:          "Code x",
	// 			SourceID:       external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation: (time.Hour).Nanoseconds(),
	// 			UserID:         userID,
	// 			DueDate:        primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
	// 		},
	// 		PriorityID:         "6",
	// 		PriorityNormalized: 0.75,
	// 		TaskNumber:         2,
	// 	}
	// 	t2Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t2)
	// 	assert.NoError(t, err)
	// 	t2.ID = t2Res.ID

	// 	t3 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			//0 ID ordering indicates new task.
	// 			IDOrdering:     0,
	// 			IDExternal:     "sample_task",
	// 			Deeplink:       "generaltask.com",
	// 			Title:          "Code x",
	// 			SourceID:       external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation: (time.Hour).Nanoseconds(),
	// 			UserID:         userID,
	// 			DueDate:        primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
	// 		},
	// 		PriorityID: "2",
	// 		TaskNumber: 3,
	// 	}
	// 	t3Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t3)
	// 	assert.NoError(t, err)
	// 	t3.ID = t3Res.ID

	// 	t4 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			//0 ID ordering indicates new task.
	// 			IDOrdering:     0,
	// 			IDExternal:     "sample_task",
	// 			Deeplink:       "generaltask.com",
	// 			Title:          "Code x",
	// 			SourceID:       external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation: (time.Hour).Nanoseconds(),
	// 			UserID:         userID,
	// 			DueDate:        primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
	// 		},
	// 		PriorityID: "3",
	// 		TaskNumber: 4,
	// 	}
	// 	t4Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t4)
	// 	assert.NoError(t, err)
	// 	t4.ID = t4Res.ID

	// 	result, err := MergeTasksV2(
	// 		db,
	// 		&[]database.TaskBase{},
	// 		[]*database.TaskRecord{},
	// 		[]*database.Task{&t1, &t2, &t3, &t4},
	// 		userID,
	// 	)
	// 	assert.NoError(t, err)

	// 	assert.Equal(t, 3, len(result))
	// 	assert.Equal(t, 4, len(result[0].Tasks))
	// 	todayTasks := result[0].Tasks
	// 	assert.Equal(t, t1.ID, todayTasks[0].ID)
	// 	assert.Equal(t, t3.ID, todayTasks[1].ID)
	// 	assert.Equal(t, t4.ID, todayTasks[2].ID)
	// 	assert.Equal(t, t2.ID, todayTasks[3].ID)
	// })
	// t.Run("SectionTasksStay", func(t *testing.T) {
	// 	userID := primitive.NewObjectID()
	// 	t1 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			IDOrdering:     2,
	// 			IDExternal:     "sample_task",
	// 			IDTaskSection:  constants.IDTaskSectionBlocked,
	// 			Deeplink:       "generaltask.com",
	// 			Title:          "Code x",
	// 			SourceID:       external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation: (time.Hour).Nanoseconds(),
	// 			UserID:         userID,
	// 			DueDate:        primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
	// 		},
	// 		PriorityID:         "5",
	// 		PriorityNormalized: 0.5,
	// 		TaskNumber:         7,
	// 	}
	// 	t1Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t1)
	// 	assert.NoError(t, err)
	// 	t1.ID = t1Res.ID

	// 	t2 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			IDOrdering:     1,
	// 			IDExternal:     "sample_task2",
	// 			IDTaskSection:  constants.IDTaskSectionBlocked,
	// 			Deeplink:       "generaltask.com",
	// 			Title:          "Code x",
	// 			SourceID:       external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation: (time.Hour).Nanoseconds(),
	// 			UserID:         userID,
	// 			DueDate:        primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
	// 		},
	// 		PriorityID:         "3",
	// 		PriorityNormalized: 0.0,
	// 		TaskNumber:         12,
	// 	}
	// 	t2Res, err := database.GetOrCreateTask(db, userID, "sample_task2", external.TASK_SOURCE_ID_JIRA, t2)
	// 	assert.NoError(t, err)
	// 	t2.ID = t2Res.ID

	// 	t3 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			IDOrdering:     2,
	// 			IDExternal:     "sample_task",
	// 			IDTaskSection:  constants.IDTaskSectionBacklog,
	// 			Deeplink:       "generaltask.com",
	// 			Title:          "Code x",
	// 			SourceID:       external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation: (time.Hour).Nanoseconds(),
	// 			UserID:         userID,
	// 			DueDate:        primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
	// 		},
	// 		PriorityID:         "5",
	// 		PriorityNormalized: 0.5,
	// 		TaskNumber:         7,
	// 	}
	// 	t3Res, err := database.GetOrCreateTask(db, userID, "sample_task", external.TASK_SOURCE_ID_JIRA, t3)
	// 	assert.NoError(t, err)
	// 	t3.ID = t3Res.ID

	// 	t4 := database.Task{
	// 		TaskBase: database.TaskBase{
	// 			IDOrdering:     1,
	// 			IDExternal:     "sample_task2",
	// 			IDTaskSection:  constants.IDTaskSectionBacklog,
	// 			Deeplink:       "generaltask.com",
	// 			Title:          "Code x",
	// 			SourceID:       external.TASK_SOURCE_ID_JIRA,
	// 			TimeAllocation: (time.Hour).Nanoseconds(),
	// 			UserID:         userID,
	// 			DueDate:        primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
	// 		},
	// 		PriorityID:         "3",
	// 		PriorityNormalized: 0.0,
	// 		TaskNumber:         12,
	// 	}
	// 	t4Res, err := database.GetOrCreateTask(db, userID, "sample_task2", external.TASK_SOURCE_ID_JIRA, t4)
	// 	assert.NoError(t, err)
	// 	t4.ID = t4Res.ID

	// 	result, err := MergeTasksV2(
	// 		db,
	// 		&[]database.TaskBase{t1.TaskBase, t2.TaskBase, t3.TaskBase, t4.TaskBase},
	// 		[]*database.TaskRecord{},
	// 		[]*database.Task{&t1, &t2, &t3, &t4},
	// 		userID,
	// 	)
	// 	assert.NoError(t, err)

	// 	assert.Equal(t, 3, len(result))
	// 	assert.Equal(t, 0, len(result[0].Tasks))
	// 	assert.Equal(t, 2, len(result[1].Tasks))
	// 	assert.Equal(t, 2, len(result[2].Tasks))
	// 	assert.Equal(t, t2.ID, result[1].Tasks[0].ID)
	// 	assert.Equal(t, t1.ID, result[1].Tasks[1].ID)
	// 	assert.Equal(t, t4.ID, result[2].Tasks[0].ID)
	// 	assert.Equal(t, t3.ID, result[2].Tasks[1].ID)
	// })
	t.Run("EmailOrderingOldestFirst", func(t *testing.T) {
		userID := primitive.NewObjectID()
		e1ID := primitive.NewObjectID()
		e1 := database.TaskRecord{
			TaskBase: database.TaskBase{
				ID:                e1ID,
				IDExternal:        "sample_email",
				Deeplink:          "generaltask.com",
				Title:             "Respond to this email",
				SourceID:          external.TASK_SOURCE_ID_GMAIL,
				TimeAllocation:    (time.Minute * 5).Nanoseconds(),
				CreatedAtExternal: primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
			},
			Email: database.Email{

				SenderDomain: "gmail.com",
			},
		}

		e2ID := primitive.NewObjectID()
		e2 := database.TaskRecord{
			TaskBase: database.TaskBase{
				ID:                e2ID,
				IDExternal:        "sample_email",
				Deeplink:          "generaltask.com",
				Title:             "Respond to this email but sent more recently",
				SourceID:          external.TASK_SOURCE_ID_GMAIL,
				TimeAllocation:    (time.Minute * 5).Nanoseconds(),
				CreatedAtExternal: primitive.NewDateTimeFromTime(time.Now().Add(-time.Minute)),
			},
			Email: database.Email{

				SenderDomain: "gmail.com",
			},
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
			[]*database.TaskRecord{&e1, &e2},
			[]*database.Task{},
			userID,
		)
		assert.NoError(t, err)

		fmt.Println("jerd")
		fmt.Println("e1id", e1ID)
		fmt.Println("e2id", e2ID)

		assert.Equal(t, 3, len(result))
		assert.Equal(t, 2, len(result[0].Tasks))
		todayTasks := result[0].Tasks
		assert.Equal(t, e1ID, todayTasks[0].ID)
		assert.Equal(t, e2ID, todayTasks[1].ID)
	})
}
