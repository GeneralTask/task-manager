package external

import (
	"errors"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
)

func TestEmptyCalendarResult(t *testing.T) {
	err := errors.New("example error")
	result := emptyCalendarResult(err)
	assert.Equal(t, result.CalendarEvents, []*database.CalendarEvent{})
	assert.Equal(t, result.Error, err)
}

func TestEmptyTaskResult(t *testing.T) {
	err := errors.New("example error")
	result := emptyTaskResult(err)
	assert.Equal(t, result.Tasks, []*database.Task{})
	assert.Equal(t, result.Error, err)
}

func TestEmptyTaskResultWithSource(t *testing.T) {
	err := errors.New("example error")
	result := emptyTaskResultWithSource(err, "example source")
	assert.Equal(t, result.Tasks, []*database.Task{})
	assert.Equal(t, result.Error, err)
	assert.Equal(t, result.SourceID, "example source")
}

func TestPullRequestResult(t *testing.T) {
	err := errors.New("example error")
	result := emptyPullRequestResult(err, true)
	assert.Equal(t, result.PullRequests, []*database.PullRequest{})
	assert.Equal(t, result.Error, err)
	assert.True(t, result.SuppressSentry)
}
