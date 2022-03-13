package external

import "github.com/GeneralTask/task-manager/backend/database"

type CalendarResult struct {
	CalendarEvents []*database.Item
	Error          error
}

type EmailResult struct {
	Emails     []*database.Item
	Error      error
	IsBadToken bool
	SourceID   string
}

type TaskResult struct {
	Tasks           []*database.Item
	PriorityMapping *map[string]int
	Error           error
	SourceID   		string
}

type PullRequestResult struct {
	PullRequests []*database.Item
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

func emptyEmailResultWithSource(err error, sourceID string) EmailResult {
	result := emptyEmailResult(err)
	result.SourceID = sourceID
	return result
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
		PullRequests: []*database.Item{},
		Error:        err,
	}
}
