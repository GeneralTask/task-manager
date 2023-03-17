package api

import (
	"context"
	"sort"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func (api *API) MeetingPreparationTasksList(c *gin.Context) {
	userID := getUserIDFromContext(c)
	_, err := database.GetUser(api.DB, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to get user")
		Handle500(c)
		return
	}
	timezoneOffset, err := GetTimezoneOffsetFromHeader(c)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	meetingTasksResult, err := api.GetMeetingPreparationTasksResult(userID, timezoneOffset)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to get meeting preparation tasks")
		Handle500(c)
	}

	c.JSON(200, meetingTasksResult)
}

func (api *API) GetMeetingPreparationTasksResult(userID primitive.ObjectID, timezoneOffset time.Duration) ([]*TaskResultV4, error) {
	timeNow := api.GetCurrentLocalizedTime(timezoneOffset)
	eventsUntilEndOfDay, err := database.GetEventsUntilEndOfDay(api.DB, userID, timeNow)
	if err != nil && err != mongo.ErrNoDocuments {
		return nil, err
	}

	// get or create tasks from the events from now until end of day
	// update task timing if needed
	// note: can include completed, deleted tasks
	isMeetingPreparationAdded, err := api.IsMeetingPreparationAdded(userID)
	if err != nil {
		return nil, err
	}
	var tasks *[]database.Task
	if isMeetingPreparationAdded {
		tasks, err = api.GetAndUpdateMeetingPreparationTasksFromEvents(userID, eventsUntilEndOfDay)
		if err != nil {
			return nil, err
		}
	} else {
		tasks = &[]database.Task{}
	}

	// get previous tasks that are not completed, mark as auto-completed
	err = api.MarkEarlierMeetingPrepTasksAutomaticallyComplete(userID, timeNow)
	if err != nil {
		return nil, err
	}

	// limits response to 100 items by DB
	completedMeetingTasks, err := database.GetEarlierCompletedMeetingPrepTasks(api.DB, userID, timeNow)
	if err != nil {
		return nil, err
	}

	// limits response to 100 items by DB
	deletedMeetingTasks, err := database.GetEarlierDeletedMeetingPrepTasks(api.DB, userID, timeNow)
	if err != nil {
		return nil, err
	}

	allTasks := append(*tasks, *completedMeetingTasks...)
	allTasks = append(allTasks, *deletedMeetingTasks...)

	// Sort by datetime_start and put tasks with earlier datetime_start first
	sort.Slice(allTasks, func(i, j int) bool {
		return (allTasks)[i].MeetingPreparationParams.DatetimeStart < (allTasks)[j].MeetingPreparationParams.DatetimeStart
	})

	meetingTaskResult := api.taskListToTaskResultListV4(&allTasks)
	return meetingTaskResult, nil
}

func (api *API) IsMeetingPreparationAdded(userID primitive.ObjectID) (bool, error) {
	cursor, err := database.GetViewCollection(api.DB).Find(
		context.Background(),
		bson.M{"user_id": userID},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find views")
		return false, err
	}

	var views []database.View
	err = cursor.All(context.Background(), &views)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find views")
		return false, err
	}

	for _, view := range views {
		if view.Type == string(constants.ViewMeetingPreparation) {
			return true, nil
		}
	}

	return false, nil
}

func (api *API) GetAndUpdateMeetingPreparationTasksFromEvents(userID primitive.ObjectID, events *[]database.CalendarEvent) (*[]database.Task, error) {
	calendarAccount, err := database.GetCalendarAccounts(api.DB, userID)
	if err != nil {
		return nil, err
	}
	calendarToAccessRole := createCalendarToAccessRoleMap(calendarAccount)

	var tasks []database.Task
	taskCollection := database.GetTaskCollection(api.DB)
	for _, event := range *events {
		if accessRole, ok := calendarToAccessRole[calendarKey{event.SourceAccountID, event.CalendarID}]; ok {
			if accessRole != constants.AccessControlOwner {
				continue // only create meeting prep tasks for "owned" calendars
			}
		} else {
			continue
		}
		task, err := getOrCreateMeetingPrepTask(userID, event, taskCollection)
		if err != nil {
			return nil, err
		}

		updatedTask, err := updateActiveTaskTimingOrCompletionIfNeeded(userID, event, task, taskCollection)
		if err != nil {
			return nil, err
		}

		tasks = append(tasks, updatedTask)
	}

	return &tasks, nil
}

func getOrCreateMeetingPrepTask(userID primitive.ObjectID, event database.CalendarEvent, taskCollection *mongo.Collection) (database.Task, error) {
	// Check if meeting preparation task exists
	var task database.Task
	err := taskCollection.FindOne(
		context.Background(),
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"is_meeting_preparation_task": true},
			{"meeting_preparation_params.id_external": event.IDExternal},
			{"source_id": event.SourceID},
		},
		}).Decode(&task)

	if err != nil && err != mongo.ErrNoDocuments {
		// if DB error not related to no documents, return err
		return database.Task{}, err
	}
	if err != nil && err == mongo.ErrNoDocuments {
		// if no documents, create one
		isCompleted := false
		isDeleted := false
		taskToInsert := database.Task{
			Title:                    &event.Title,
			UserID:                   userID,
			IsCompleted:              &isCompleted,
			IsDeleted:                &isDeleted,
			SourceID:                 event.SourceID,
			CreatedAtExternal:        primitive.NewDateTimeFromTime(time.Now()),
			UpdatedAt:                primitive.NewDateTimeFromTime(time.Now()),
			IsMeetingPreparationTask: true,
			MeetingPreparationParams: &database.MeetingPreparationParams{
				CalendarEventID:               event.ID,
				IDExternal:                    event.IDExternal,
				DatetimeStart:                 event.DatetimeStart,
				DatetimeEnd:                   event.DatetimeEnd,
				HasBeenAutomaticallyCompleted: false,
				EventMovedOrDeleted:           false,
			},
		}

		insertResult, err := taskCollection.InsertOne(context.Background(), taskToInsert)
		if err != nil {
			return database.Task{}, err
		}
		taskToInsert.ID = insertResult.InsertedID.(primitive.ObjectID)
		return taskToInsert, nil
	} else {
		// if task exists, add task to list
		return task, nil
	}
}

func updateActiveTaskTimingOrCompletionIfNeeded(userID primitive.ObjectID, event database.CalendarEvent, task database.Task, taskCollection *mongo.Collection) (database.Task, error) {
	updateFields := bson.M{}
	// Update meeting prep start time if it's different from event start time
	if !event.DatetimeStart.Time().Equal(task.MeetingPreparationParams.DatetimeStart.Time()) {
		task.MeetingPreparationParams.DatetimeStart = event.DatetimeStart
		updateFields["meeting_preparation_params.datetime_start"] = event.DatetimeStart
	}
	// Update meeting prep end time if it's different from event end time
	if !event.DatetimeEnd.Time().Equal(task.MeetingPreparationParams.DatetimeEnd.Time()) {
		task.MeetingPreparationParams.DatetimeEnd = event.DatetimeEnd
		updateFields["meeting_preparation_params.datetime_end"] = event.DatetimeEnd
	}
	// if a pre-existing task, and was not manually marked complete, let's unmark completion
	if task.MeetingPreparationParams.HasBeenAutomaticallyCompleted {
		completed := false
		task.IsCompleted = &completed
		task.MeetingPreparationParams.HasBeenAutomaticallyCompleted = false
		updateFields["is_completed"] = false
		updateFields["meeting_preparation_params.has_been_automatically_completed"] = false
	}

	// If there are no fields to update, return as is
	if len(updateFields) == 0 {
		return task, nil
	} else {
		updatedAt := primitive.NewDateTimeFromTime(time.Now())
		task.UpdatedAt = updatedAt
		updateFields["updated_at"] = updatedAt
	}

	_, err := taskCollection.UpdateOne(
		context.Background(),
		bson.M{"$and": []bson.M{{"_id": task.ID}, {"user_id": userID}}},
		bson.M{"$set": updateFields},
	)
	return task, err
}

func (api *API) MarkEarlierMeetingPrepTasksAutomaticallyComplete(userID primitive.ObjectID, currentTime time.Time) error {
	filter := []bson.M{
		{"user_id": userID},
		{"meeting_preparation_params.datetime_end": bson.M{"$lte": currentTime}},
		{"is_completed": false},
		{"is_deleted": false},
	}

	// TODO switch to use datetime from event
	completedAt := primitive.NewDateTimeFromTime(time.Now())
	update := bson.M{
		"is_completed": true,
		"meeting_preparation_params.has_been_automatically_completed": true,
		"completed_at": completedAt,
	}

	taskCollection := database.GetTaskCollection(api.DB)
	_, err := taskCollection.UpdateMany(context.Background(), bson.M{"$and": filter}, bson.M{"$set": update}, nil)
	return err
}
