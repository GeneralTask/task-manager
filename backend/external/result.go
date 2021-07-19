package external

import "github.com/GeneralTask/task-manager/backend/database"

type TaskResult struct {
	Tasks           []*database.Task
	PriorityMapping *map[string]int
	Error           error
}

func emptyTaskResult(err error) TaskResult {
	var priorities map[string]int
	return TaskResult{
		Tasks:           []*database.Task{},
		PriorityMapping: &priorities,
		Error:           err,
	}
}
