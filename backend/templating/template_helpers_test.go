package templating

import (
	"github.com/stretchr/testify/assert"
	"io/ioutil"
	"path"
	"runtime"
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
		assert.Equal(t, readExpectationFile(t, "plain_text_test_expectation.html"), result)
	})
}

func readExpectationFile(t*testing.T, filename string) string {
	data, err := ioutil.ReadFile(getDirectoryOfExpectations(filename))
	assert.NoError(t, err)
	return string(data)
}

func getDirectoryOfExpectations(name string) string {
	_, filename, _, _ := runtime.Caller(1)
	filepath := path.Join(path.Dir(filename), "./test_expectations/" + name)
	return filepath
}