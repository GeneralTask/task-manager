package jobs

import (
	"context"
	"fmt"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	lock "github.com/square/mongo-lock"
)

func EnsureJobOnlyRunsOnceToday(jobName string) error {
	db, cleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer cleanup()

	lockClient := lock.NewClient(database.GetJobLocksCollection(db))
	lockClient.CreateIndexes(context.Background())

	resourceName := jobName + "_" + time.Now().Format("01-02-2006")
	fmt.Println("resource name:", resourceName)
	// leave resource locked forever so all future job attempts on this day will fail (err returned if can't instantly get lock)
	return lockClient.XLock(context.Background(), resourceName /*primitive.NewObjectID().Hex()*/, "", lock.LockDetails{})
}
