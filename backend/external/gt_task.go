package external

import (
	"context"
	"errors"
	"time"

	"github.com/GeneralTask/task-manager/backend/logging"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type GeneralTaskTaskSource struct{}

func (generalTask GeneralTaskTaskSource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (generalTask GeneralTaskTaskSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyTaskResult(err)
		return
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	cursor, err := taskCollection.Find(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"source_id": TASK_SOURCE_ID_GT_TASK},
			{"source_account_id": accountID},
			{"is_completed": false},
		}},
	)
	var tasks []*database.Item
	logger := logging.GetSentryLogger()
	if err != nil || cursor.All(dbCtx, &tasks) != nil {
		logger.Error().Err(err).Msg("failed to fetch general task tasks")
		result <- emptyTaskResult(err)
		return
	}
	result <- TaskResult{Tasks: tasks, Error: nil}
}

func (generalTask GeneralTaskTaskSource) GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil)
}

func (generalTask GeneralTaskTaskSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	taskSection := constants.IDTaskSectionDefault
	if task.IDTaskSection != primitive.NilObjectID {
		taskSection = task.IDTaskSection
	}
	newTask := database.Item{
		TaskBase: database.TaskBase{
			UserID:          userID,
			IDExternal:      primitive.NewObjectID().Hex(),
			IDTaskSection:   taskSection,
			SourceID:        TASK_SOURCE_ID_GT_TASK,
			Title:           task.Title,
			Body:            task.Body,
			TimeAllocation:  time.Hour.Nanoseconds(),
			SourceAccountID: accountID,
		},
		TaskType: database.TaskType{
			IsTask: true,
		},
	}
	if task.DueDate != nil {
		newTask.DueDate = primitive.NewDateTimeFromTime(*task.DueDate)
	}
	if task.TimeAllocation != nil {
		newTask.TimeAllocation = *task.TimeAllocation
	}

	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return primitive.NilObjectID, err
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	insertResult, err := taskCollection.InsertOne(dbCtx, newTask)
	return insertResult.InsertedID.(primitive.ObjectID), err
}

func (generalTask GeneralTaskTaskSource) CreateNewEvent(userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (generalTask GeneralTaskTaskSource) DeleteEvent(userID primitive.ObjectID, accountID string, externalID string) error {
	return errors.New("has not been implemented yet")
}

func (generalTask GeneralTaskTaskSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskItemChangeableFields, task *database.Item) error {
	return nil
}

func (generalTask GeneralTaskTaskSource) ModifyEvent(userID primitive.ObjectID, accountID string, eventID, updateFields *database.CalendarEventChangeableFields) error {
	return errors.New("has not been implemented yet")
}
