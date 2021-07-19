package external

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskSource interface {
	GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult)
	MarkTaskAsDone() error
	CompareTo() bool
}

type TaskResult struct {
	Tasks           []*database.Task
	PriorityMapping *map[string]int
	Error           error
}
