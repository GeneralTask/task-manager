package jobs

import (
	"context"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	lock "github.com/square/mongo-lock"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func EnsureJobOnlyRunsOnceToday(jobName string) (primitive.ObjectID, error) {
	db, cleanup, err := database.GetDBConnection()
	if err != nil {
		return primitive.NilObjectID, err
	}
	defer cleanup()

	lockClient := lock.NewClient(database.GetJobLocksCollection(db))
	err = lockClient.CreateIndexes(context.Background())
	if err != nil {
		return primitive.NilObjectID, err
	}

	// do not include hour for daily job
	resourceName := jobName + "_" + time.Now().Format("01-02-2006")
	// leave resource locked forever so all future job attempts on this day will fail (err returned if can't instantly get lock)
	lockID := primitive.NewObjectID()
	return lockID, lockClient.XLock(context.Background(), resourceName, lockID.Hex(), lock.LockDetails{})
}

func EnsureJobOnlyRunsPerHour(jobName string) (primitive.ObjectID, error) {
	db, cleanup, err := database.GetDBConnection()
	if err != nil {
		return primitive.NilObjectID, err
	}
	defer cleanup()

	lockClient := lock.NewClient(database.GetJobLocksCollection(db))
	err = lockClient.CreateIndexes(context.Background())
	if err != nil {
		return primitive.NilObjectID, err
	}

	resourceName := jobName + "_" + time.Now().Format("01-02-2006 15")
	// leave resource locked forever so all future job attempts on this day will fail (err returned if can't instantly get lock)
	lockID := primitive.NewObjectID()
	return lockID, lockClient.XLock(context.Background(), resourceName, lockID.Hex(), lock.LockDetails{})
}
