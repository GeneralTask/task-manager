package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetConfigValue(t *testing.T) {
	t.Run("Default", func(t *testing.T) {
		assert.Equal(t, "mongodb://root:password@localhost:27017", GetConfigValue("MONGO_URI"))
	})
	t.Run("Override", func(t *testing.T) {
		err := os.Setenv("MONGO_URI", "oopsie whoopsie")
		assert.NoError(t, err)
		assert.Equal(t, "oopsie whoopsie", GetConfigValue("MONGO_URI"))
		err = os.Unsetenv("MONGO_URI")
		assert.NoError(t, err)
	})
}
