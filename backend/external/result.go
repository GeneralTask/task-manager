package external

import "github.com/GeneralTask/task-manager/backend/database"

type CalendarResult struct {
	CalendarEvents []*database.CalendarEvent
	Error          error
}

type TaskResult struct {
	Tasks     []*database.Task
	Error     error
	SourceID  string
	ServiceID string
	AccountID string
}

type PullRequestResult struct {
	PullRequests   []*database.PullRequest
	Error          error
	SourceID       string
	SuppressSentry bool
}

func emptyCalendarResult(err error) CalendarResult {
	return CalendarResult{
		CalendarEvents: []*database.CalendarEvent{},
		Error:          err,
	}
}

func emptyTaskResult(err error) TaskResult {
	return TaskResult{
		Tasks: []*database.Task{},
		Error: err,
	}
}

func emptyTaskResultWithSource(err error, sourceID string) TaskResult {
	result := emptyTaskResult(err)
	result.SourceID = sourceID
	return result
}

func emptyPullRequestResult(err error, suppressSentry bool) PullRequestResult {
	return PullRequestResult{
		PullRequests:   []*database.PullRequest{},
		Error:          err,
		SourceID:       TASK_SOURCE_ID_GITHUB_PR,
		SuppressSentry: suppressSentry,
	}
}
