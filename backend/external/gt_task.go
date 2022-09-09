package external

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/mongo"

	"github.com/GeneralTask/task-manager/backend/logging"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type GeneralTaskTaskSource struct{}

func (generalTask GeneralTaskTaskSource) GetEvents(db *mongo.Database, userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (generalTask GeneralTaskTaskSource) GetTasks(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	parentCtx := context.Background()
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
	var tasks []*database.Task
	logger := logging.GetSentryLogger()
	if err != nil || cursor.All(dbCtx, &tasks) != nil {
		logger.Error().Err(err).Msg("failed to fetch general task tasks")
		result <- emptyTaskResult(err)
		return
	}
	result <- TaskResult{Tasks: tasks, Error: nil}
}

func (generalTask GeneralTaskTaskSource) GetPullRequests(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil)
}

func (generalTask GeneralTaskTaskSource) CreateNewTask(db *mongo.Database, userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	taskSection := constants.IDTaskSectionDefault
	if task.IDTaskSection != primitive.NilObjectID {
		taskSection = task.IDTaskSection
	}
	timeAllocation := time.Hour.Nanoseconds()
	completed := false
	newTask := database.Task{
		UserID:          userID,
		IDExternal:      primitive.NewObjectID().Hex(),
		IDTaskSection:   taskSection,
		SourceID:        TASK_SOURCE_ID_GT_TASK,
		Title:           &task.Title,
		Body:            &task.Body,
		TimeAllocation:  &timeAllocation,
		SourceAccountID: accountID,
		IsCompleted:     &completed,
	}
	if task.DueDate != nil {
		dueDate := primitive.NewDateTimeFromTime(*task.DueDate)
		newTask.DueDate = &dueDate
	}
	if task.TimeAllocation != nil {
		newTask.TimeAllocation = task.TimeAllocation
	}
	if task.ParentTaskID != primitive.NilObjectID {
		hexID := task.ParentTaskID.Hex()
		newTask.ParentTaskIDHex = &hexID
	}

	parentCtx := context.Background()
	taskCollection := database.GetTaskCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	insertResult, err := taskCollection.InsertOne(dbCtx, newTask)
	return insertResult.InsertedID.(primitive.ObjectID), err
}

func (generalTask GeneralTaskTaskSource) CreateNewEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (generalTask GeneralTaskTaskSource) DeleteEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, externalID string) error {
	return errors.New("has not been implemented yet")
}

func (generalTask GeneralTaskTaskSource) ModifyTask(db *mongo.Database, userID primitive.ObjectID, accountID string, issueID string, updateFields *database.Task, task *database.Task) error {
	return nil
}

func (generalTask GeneralTaskTaskSource) ModifyEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, eventID string, updateFields *EventModifyObject) error {
	return errors.New("has not been implemented yet")
}
