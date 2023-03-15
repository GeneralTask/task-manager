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
	tasks, err := api.GetAndUpdateMeetingPreparationTasksFromEvent(userID, eventsUntilEndOfDay)
	if err != nil {
		return nil, err
	}

	// get previous tasks that are not completed, mark as auto-completed
	err = api.MarkEarlierTasksAutomaticallyComplete(userID, timeNow)
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

func (api *API) GetAndUpdateMeetingPreparationTasksFromEvent(userID primitive.ObjectID, events *[]database.CalendarEvent) (*[]database.Task, error) {
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

func (api *API) MarkEarlierTasksAutomaticallyComplete(userID primitive.ObjectID, currentTime time.Time) error {
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

func (api *API) UpdateMeetingPreparationTasks(userID primitive.ObjectID, meetingPreparationTasks *[]database.Task, timezoneOffset time.Duration) error {
	timeNow := api.GetCurrentLocalizedTime(timezoneOffset)
	for index, task := range *meetingPreparationTasks {
		// Get event for meeting prep task from DB
		associatedEvent, err := database.GetCalendarEventByExternalId(api.DB, task.MeetingPreparationParams.IDExternal, userID)
		if err != nil && err != mongo.ErrNoDocuments {
			return err
		}
		taskCollection := database.GetTaskCollection(api.DB)
		// Create MeetingPreparationParams if it doesn't exist
		if task.MeetingPreparationParams == nil {
			(*meetingPreparationTasks)[index].MeetingPreparationParams = &database.MeetingPreparationParams{}
		}
		// If we can't find the event in the DB, we say the event is deleted. Eventually we'll want to make gcal api call to check if event was actually deleted
		// No need to update this if we already know that the event was deleted
		if associatedEvent == nil && !task.MeetingPreparationParams.EventMovedOrDeleted {
			updatedAt := primitive.NewDateTimeFromTime(time.Now())
			(*meetingPreparationTasks)[index].UpdatedAt = updatedAt
			(*meetingPreparationTasks)[index].MeetingPreparationParams.EventMovedOrDeleted = true

			_, err := taskCollection.UpdateOne(
				context.Background(),
				bson.M{"$and": []bson.M{
					{"_id": task.ID},
					{"user_id": userID},
				}},
				bson.M{"$set": bson.M{
					"updated_at": updatedAt,
					"meeting_preparation_params.event_moved_or_deleted": true,
				}},
			)
			if err != nil {
				return err
			}
		} else if associatedEvent != nil {
			updateFields := bson.M{}
			// Update meeting prep start time if it's different from event start time
			if !associatedEvent.DatetimeStart.Time().Equal(task.MeetingPreparationParams.DatetimeStart.Time()) {
				(*meetingPreparationTasks)[index].MeetingPreparationParams.DatetimeStart = associatedEvent.DatetimeStart
				(*meetingPreparationTasks)[index].MeetingPreparationParams.EventMovedOrDeleted = true
				updateFields["meeting_preparation_params.datetime_start"] = associatedEvent.DatetimeStart
				updateFields["meeting_preparation_params.event_moved_or_deleted"] = true
			}
			// Update meeting prep end time if it's different from event end time
			if !associatedEvent.DatetimeEnd.Time().Equal(task.MeetingPreparationParams.DatetimeEnd.Time()) {
				(*meetingPreparationTasks)[index].MeetingPreparationParams.DatetimeEnd = associatedEvent.DatetimeEnd
				updateFields["meeting_preparation_params.datetime_end"] = associatedEvent.DatetimeEnd
			}
			// Update meeting prep task to completed if event has ended and task has not been auto completed
			if associatedEvent.DatetimeEnd.Time().Before(timeNow) && !task.MeetingPreparationParams.HasBeenAutomaticallyCompleted {
				completedAt := primitive.NewDateTimeFromTime(time.Now())
				isCompleted := true
				(*meetingPreparationTasks)[index].IsCompleted = &isCompleted
				(*meetingPreparationTasks)[index].CompletedAt = completedAt
				(*meetingPreparationTasks)[index].MeetingPreparationParams.HasBeenAutomaticallyCompleted = true
				updateFields["is_completed"] = true
				updateFields["completed_at"] = completedAt
				updateFields["meeting_preparation_params.has_been_automatically_completed"] = true
			}
			// If there are no fields to update, skip to next task
			if len(updateFields) == 0 {
				continue
			} else {
				updatedAt := primitive.NewDateTimeFromTime(time.Now())
				(*meetingPreparationTasks)[index].UpdatedAt = updatedAt
				updateFields["updated_at"] = updatedAt
			}

			_, err := taskCollection.UpdateOne(
				context.Background(),
				bson.M{"$and": []bson.M{{"_id": task.ID}, {"user_id": userID}}},
				bson.M{"$set": updateFields},
			)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
