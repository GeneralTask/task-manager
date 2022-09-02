package utils

import (
	"os"
	"testing"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/assert"
)

func TestConfigureLogger(t *testing.T) {
	t.Run("info", func(t *testing.T) {
		os.Setenv("LOG_LEVEL", "info")
		ConfigureLogger(config.Dev)
		infoEnabled := log.Info().Enabled()
		assert.True(t, infoEnabled)
		traceEnabled := log.Trace().Enabled()
		assert.False(t, traceEnabled)
		os.Unsetenv("LOG_LEVEL")
	})
	t.Run("panic", func(t *testing.T) {
		os.Setenv("LOG_LEVEL", "panic")
		ConfigureLogger(config.Dev)
		panicEnabled := log.Panic().Enabled()
		assert.True(t, panicEnabled)
		infoEnabled := log.Info().Enabled()
		assert.False(t, infoEnabled)
		os.Unsetenv("LOG_LEVEL")
	})
}

func TestColorize(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		colorized := colorize("hello", 36)
		assert.Equal(t, "\x1b[36mhello\x1b[0m", colorized)
	})
}
