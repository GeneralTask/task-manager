package logging

import (
	"io"
	"os"

	"github.com/GeneralTask/task-manager/backend/config"
	zlogsentry "github.com/archdx/zerolog-sentry"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

const SentryDSN = "https://2b8b40065a7c480584a06774b22741d5@o1302719.ingest.sentry.io/6540750"

// note: sentry logger returns a stdout logger when not in production
func GetSentryLogger() *zerolog.Logger {
	var logger io.Writer
	if config.GetEnvironment() == config.Prod {
		w, err := zlogsentry.New(SentryDSN, zlogsentry.WithLevels(zerolog.WarnLevel, zerolog.ErrorLevel, zerolog.FatalLevel, zerolog.PanicLevel))
		if err != nil {
			log.Error().Err(err).Msg("failed to initialize sentry logger")
		}

		defer w.Close()
		logger = io.MultiWriter(w, os.Stdout)
	} else {
		logger = os.Stdout
	}

	result := zerolog.New(logger).With().Timestamp().Logger()
	return &result
}
