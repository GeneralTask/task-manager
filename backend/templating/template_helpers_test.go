package templating

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestFormatPlainText(t *testing.T) {
	t.Run("EmptyDescription", func(t *testing.T) {
		result, err := FormatPlainTextAsHTML("")
		assert.NoError(t, err)
		assert.Equal(t, "", result)
	})

	t.Run("Normal", func(t *testing.T) {
		result, err := FormatPlainTextAsHTML("Test Description")
		assert.NoError(t, err)
		assert.Equal(t, "\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    " +
			"<style>\n        html, body {\n            font-size: 16px;\n            font-family: \"Gothic A1\", " +
			"sans-serif;\n        }\n    </style>\n</head>\n<body>\n<div>Test Description</div>\n</body>\n</html>\n",
			result)
	})
}