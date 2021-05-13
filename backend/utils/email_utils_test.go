package utils

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestExtractEmailDomain(t *testing.T) {
	assert.Equal(t, "gmail.com", ExtractEmailDomain("jasonscharff@gmail.com"))
	assert.Equal(t, "robinhood.com", ExtractEmailDomain("john@robinhood.com"))
	assert.Equal(t, "robinhood.com", ExtractEmailDomain("john@robinhood.com testing"))
}

func TestExtractSenders(t *testing.T) {
	name, email := ExtractSenderName("Clockwise  <hello@getclockwise.com>")
	assert.Equal(t, "Clockwise", name)
	assert.Equal(t, "hello@getclockwise.com", email)

	name, email = ExtractSenderName("Jason Scharff <jasonscharff@gmail.com>")
	assert.Equal(t, "Jason Scharff", name)
	assert.Equal(t, "jasonscharff@gmail.com", email)

	name, email = ExtractSenderName("Testing 123 <test@example.com>")
	assert.Equal(t, "Testing 123", name)
	assert.Equal(t, "test@example.com", email)

	name, email = ExtractSenderName("jasonscharff@gmail.com")
	assert.Equal(t, "jasonscharff@gmail.com", name)
	assert.Equal(t, "jasonscharff@gmail.com", email)
}