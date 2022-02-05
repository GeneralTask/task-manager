package external

import "github.com/GeneralTask/task-manager/backend/database"

type CalendarResult struct {
	CalendarEvents []*database.Item
	Error          error
}

type EmailResult struct {
	Emails []*database.Item
	Error  error
}

type TaskResult struct {
	Tasks           []*database.Item
	PriorityMapping *map[string]int
	Error           error
}

type PullRequestResult struct {
	PullRequests []*database.PullRequest
	Error        error
}

func emptyCalendarResult(err error) CalendarResult {
	return CalendarResult{
		CalendarEvents: []*database.Item{},
		Error:          err,
	}
}

func emptyEmailResult(err error) EmailResult {
	return EmailResult{
		Emails: []*database.Item{},
		Error:  err,
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

func emptyPullRequestResult(err error) PullRequestResult {
	return PullRequestResult{
		PullRequests: []*database.PullRequest{},
		Error:        err,
	}
}
