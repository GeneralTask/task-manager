package config

import (
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetEnvironment(t *testing.T) {
	t.Run("Prod", func(t *testing.T) {
		os.Setenv("ENVIRONMENT", "prod")
		env := GetEnvironment()
		assert.Equal(t, Prod, env)
		os.Unsetenv("ENVIRONMENT")
	})
	t.Run("Dev", func(t *testing.T) {
		os.Setenv("ENVIRONMENT", "dev")
		env := GetEnvironment()
		assert.Equal(t, Dev, env)
		os.Unsetenv("ENVIRONMENT")
	})
}

func TestGetConfigValue(t *testing.T) {
	t.Run("Default", func(t *testing.T) {
		assert.Equal(t, "mongodb://root:example@localhost:27017", GetConfigValue("MONGO_URI"))
	})
	t.Run("Override", func(t *testing.T) {
		err := os.Setenv("MONGO_URI", "oopsie whoopsie")
		assert.NoError(t, err)
		assert.Equal(t, "oopsie whoopsie", GetConfigValue("MONGO_URI"))
		err = os.Unsetenv("MONGO_URI")
		assert.NoError(t, err)
	})
}

func TestGetAuthorizationURL(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		authURL := GetAuthorizationURL("test_service")
		assert.True(t, strings.HasSuffix(authURL, "link/test_service/"))
	})
}
