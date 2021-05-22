package templating

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestJiraTemplate(t *testing.T) {

	t.Run("EmptyDescription", func(t *testing.T) {
		result, err := GetJIRAHTMLString("")
		assert.NoError(t, err)
		assert.Equal(t, "", result)
	})

	t.Run("Normal", func(t *testing.T) {
		result, err := GetJIRAHTMLString("Test Description")
		assert.NoError(t, err)
		assert.Equal(t, "<div>Test Description</div>", result)
	})
}