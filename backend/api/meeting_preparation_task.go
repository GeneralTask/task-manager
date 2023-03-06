package api

import (
	"context"
	"fmt"
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
	if err != nil {
		return nil, err
	}

	err = api.CreateMeetingPreparationTasksFromEvent(userID, eventsUntilEndOfDay)
	if err != nil {
		return nil, err
	}

	meetingTasks, err := database.GetAllMeetingPreparationTasks(api.DB, userID)
	if err != nil {
		return nil, err
	}

	err = api.UpdateMeetingPreparationTasks(userID, meetingTasks, timezoneOffset)
	if err != nil {
		return nil, err
	}

	// Sort by datetime_start and put tasks with later datetime_start first
	sort.Slice(*meetingTasks, func(i, j int) bool {
		return (*meetingTasks)[i].MeetingPreparationParams.DatetimeStart > (*meetingTasks)[j].MeetingPreparationParams.DatetimeStart
	})
	if len(*meetingTasks) > 100 {
		*meetingTasks = (*meetingTasks)[:100]
	}
	//Reverse the order of the tasks
	sort.Slice(*meetingTasks, func(i, j int) bool {
		return (*meetingTasks)[i].MeetingPreparationParams.DatetimeStart < (*meetingTasks)[j].MeetingPreparationParams.DatetimeStart
	})

	meetingTaskResult := api.taskListToTaskResultListV4(meetingTasks, userID)
	// Limit to 100 tasks in response
	if len(meetingTaskResult) > 100 {
		meetingTaskResult = meetingTaskResult[:100]
	}
	return meetingTaskResult, nil
}

func (api *API) CreateMeetingPreparationTasksFromEvent(userID primitive.ObjectID, events *[]database.CalendarEvent) error {
	calendarAccount, err := database.GetCalendarAccounts(api.DB, userID)
	if err != nil {
		return err
	}
	calendarToAccessRole := createCalendarToAccessRoleMap(calendarAccount)

	taskCollection := database.GetTaskCollection(api.DB)
	for _, event := range *events {
		if accessRole, ok := calendarToAccessRole[calendarKey{event.SourceAccountID, event.CalendarID}]; ok {
			if accessRole != constants.AccessControlOwner {
				continue // only create meeting prep tasks for "owned" calendars
			}
		} else {
			continue
		}
		// Check if meeting preparation task exists
		count, err := taskCollection.CountDocuments(
			context.Background(),
			bson.M{"$and": []bson.M{
				{"user_id": userID},
				{"is_meeting_preparation_task": true},
				{"meeting_preparation_params.id_external": event.IDExternal},
				{"source_id": event.SourceID},
			},
			})

		if err != nil {
			return err
		}
		fmt.Printf("count: %d", count)
		// If meeting preparation task does not exist, create it
		if count == 0 {
			isCompleted := false
			isDeleted := false
			_, err = taskCollection.InsertOne(context.Background(), database.Task{
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
			})
			if err != nil {
				return err
			}
		}
	}
	return nil
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
		if associatedEvent == nil {
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
		} else {
			updateFields := bson.M{}
			// Updatdate meeting prep start time if it's different from event start time
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
				fmt.Print("Completing the task")
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
