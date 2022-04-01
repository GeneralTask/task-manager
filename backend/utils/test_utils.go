package utils

import (
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
)

func AssertTasksEqual(t *testing.T, a *database.Item, b *database.Item) {
	assert.Equal(t, a.UserID, b.UserID)
	assert.Equal(t, a.IDExternal, b.IDExternal)
	assert.Equal(t, a.IDOrdering, b.IDOrdering)
	assert.Equal(t, a.IDTaskSection, b.IDTaskSection)
	assert.Equal(t, a.IsCompleted, b.IsCompleted)
	assert.Equal(t, a.Sender, b.Sender)
	assert.Equal(t, a.SourceID, b.SourceID)
	assert.Equal(t, a.SourceAccountID, b.SourceAccountID)
	assert.Equal(t, a.Deeplink, b.Deeplink)
	assert.Equal(t, a.Title, b.Title)
	assert.Equal(t, a.TaskBase.Body, b.TaskBase.Body)
	assert.Equal(t, a.HasBeenReordered, b.HasBeenReordered)
	assert.Equal(t, a.TimeAllocation, b.TimeAllocation)
	assert.Equal(t, a.ConferenceCall, b.ConferenceCall)
	assert.Equal(t, a.CreatedAtExternal, b.CreatedAtExternal)
}
