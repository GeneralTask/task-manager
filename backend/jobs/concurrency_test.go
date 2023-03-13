package jobs

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetSettingsOptions(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		assert.NoError(t, EnsureJobOnlyRunsOnceToday("foobar"))
		assert.Error(t, EnsureJobOnlyRunsOnceToday("foobar"))
		assert.NoError(t, EnsureJobOnlyRunsOnceToday("foobar2"))
	})
}
