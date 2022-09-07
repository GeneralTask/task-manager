package utils

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

const MilitaryTimeOnly = "03:04:05"

func ConfigureLogger(env config.Environment) {
	if env == config.Dev {
		log.Logger = CreateConsoleLogger().With().Caller().Logger()
	}
	zerolog.SetGlobalLevel(zerolog.DebugLevel)
	logLevel, err := zerolog.ParseLevel(config.GetConfigValue("LOG_LEVEL"))
	if err == nil && logLevel != zerolog.NoLevel {
		zerolog.SetGlobalLevel(logLevel)
	}
	log.Info().Msgf("Log level set to %s", logLevel)
}

func CreateConsoleLogger() zerolog.Logger {
	consoleWriter := zerolog.NewConsoleWriter(func(w *zerolog.ConsoleWriter) {
		w.FormatTimestamp = consoleFormatTimestamp(MilitaryTimeOnly)
		w.Out = os.Stderr
	})
	return log.Output(consoleWriter)
}

// colorize returns the string s wrapped in ANSI code c, unless disabled is true.
func colorize(s interface{}, c int) string {
	return fmt.Sprintf("\x1b[%dm%v\x1b[0m", c, s)
}

// copied from https://github.com/rs/zerolog/issues/246#issuecomment-955884269
func consoleFormatTimestamp(timeFormat string) zerolog.Formatter {
	return func(i interface{}) string {
		t := "<nil>"
		switch tt := i.(type) {
		case string:
			ts, err := time.Parse(zerolog.TimeFieldFormat, tt)
			if err != nil {
				t = tt
			} else {
				t = ts.Format(timeFormat)
			}
		case json.Number:
			i, err := tt.Int64()
			if err != nil {
				t = tt.String()
			} else {
				var sec, nsec int64 = i, 0
				switch zerolog.TimeFieldFormat {
				case zerolog.TimeFormatUnixMs:
					nsec = int64(time.Duration(i) * time.Millisecond)
					sec = 0
				case zerolog.TimeFormatUnixMicro:
					nsec = int64(time.Duration(i) * time.Microsecond)
					sec = 0
				}
				ts := time.Unix(sec, nsec).UTC()
				t = ts.Format(timeFormat)
			}
		}
		return colorize(t, 36)
	}
}
