package external

import "github.com/GeneralTask/task-manager/backend/database"

type CalendarResult struct {
	CalendarEvents []*database.CalendarEvent
	Error          error
}

type TaskResult struct {
	Tasks           []*database.Item
	PriorityMapping *map[string]int
	Error           error
	SourceID        string
}

type PullRequestResult struct {
	PullRequests []*database.PullRequest
	Error        error
	SourceID     string
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
		Tasks:           []*database.Item{},
		PriorityMapping: &priorities,
		Error:           err,
	}
}

func emptyTaskResultWithSource(err error, sourceID string) TaskResult {
	result := emptyTaskResult(err)
	result.SourceID = sourceID
	return result
}

func emptyPullRequestResult(err error) PullRequestResult {
	return PullRequestResult{
		PullRequests: []*database.PullRequest{},
		Error:        err,
		SourceID:     TASK_SOURCE_ID_GITHUB_PR,
	}
}
