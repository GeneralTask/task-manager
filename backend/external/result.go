package external

import "github.com/GeneralTask/task-manager/backend/database"

type CalendarResult struct {
	CalendarEvents []*database.CalendarEvent
	Error          error
}

type TaskResult struct {
	Tasks           []*database.Task
	PriorityMapping *map[string]int
	Error           error
}

func emptyCalendarResult(err error) CalendarResult {
	return CalendarResult{
		CalendarEvents: []*database.CalendarEvent{},
		Error:          err,
	}
}

func emptyTaskResult(err error) TaskResult {
	var priorities map[string]int
	return TaskResult{
		Tasks:           []*database.Task{},
		PriorityMapping: &priorities,
		Error:           err,
	}
}
