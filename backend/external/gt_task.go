package external

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const DefaultAccountID string = "default"

type GeneralTaskTaskSource struct{}

func (GeneralTask GeneralTaskTaskSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult) {
	result <- emptyEmailResult(nil)
}

func (GeneralTask GeneralTaskTaskSource) GetEvents(userID primitive.ObjectID, accountID string, timezoneOffsetMinutes int, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (GeneralTask GeneralTaskTaskSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
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

	log.Println("filter:", bson.M{"$and": []bson.M{
		{"user_id": userID},
		{"source_id": TASK_SOURCE_ID_GT_TASK},
		{"source_account_id": accountID},
		{"is_completed": false},
	}})
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
	if err != nil || cursor.All(dbCtx, &tasks) != nil {
		log.Printf("failed to fetch general task tasks: %v", err)
		result <- emptyTaskResult(err)
		return
	}
	result <- TaskResult{Tasks: tasks, Error: nil}
}

func (GeneralTask GeneralTaskTaskSource) MarkAsDone(userID primitive.ObjectID, accountID string, taskID string) error {
	return nil
}

func (GeneralTask GeneralTaskTaskSource) Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, body string) error {
	return errors.New("general task task does not support replies")
}

func (GeneralTask GeneralTaskTaskSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	newTask := database.Task{
		TaskBase: database.TaskBase{
			UserID:          userID,
			IDExternal:      primitive.NewObjectID().Hex(),
			IDTaskSection:   constants.IDTaskSectionToday,
			SourceID:        TASK_SOURCE_ID_GT_TASK,
			Title:           task.Title,
			Body:            task.Body,
			TimeAllocation:  time.Hour.Nanoseconds(),
			SourceAccountID: accountID,
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
		return err
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = taskCollection.InsertOne(dbCtx, newTask)
	return err
}
