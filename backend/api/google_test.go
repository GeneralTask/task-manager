package api

import (
	"testing"

	"github.com/go-playground/assert/v2"
)

func TestExtractSenders(t *testing.T) {
	assert.Equal(t, "Clockwise", extractSenderName("Clockwise  <hello@getclockwise.com>"))
	assert.Equal(t, "Jason Scharff", extractSenderName("Jason Scharff <jasonscharff@gmail.com>"))
	assert.Equal(t, "Testing 123", extractSenderName("Testing 123 <test@example.com>"))
	assert.Equal(t, "jasonscharff@gmail.com", extractSenderName("jasonscharff@gmail.com"))
}
