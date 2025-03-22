package logger

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/rs/zerolog"
)

var writer io.Writer = os.Stderr

func SetupLogLevel(logLevel string) {
	level, _ := zerolog.ParseLevel(logLevel)
	zerolog.SetGlobalLevel(level)
}

func SetupWriter() {
	writer = zerolog.ConsoleWriter{
		Out:          os.Stderr,
		FormatCaller: consoleDefaultFormatCaller(false),
		TimeFormat:   "15:04:05",
	}
}

func New() zerolog.Logger {
	log := zerolog.New(writer).
		Level(zerolog.GlobalLevel()).
		With().
		Timestamp().
		CallerWithSkipFrameCount(zerolog.CallerSkipFrameCount).
		Logger()

	return log
}

func consoleDefaultFormatCaller(noColor bool) zerolog.Formatter {
	const (
		colorCyan = 35
		colorBold = 1
	)

	colorize := func(s interface{}, c int, disabled bool) string {
		if disabled {
			return fmt.Sprintf("%s", s)
		}
		return fmt.Sprintf("\x1b[%dm%v\x1b[0m", c, s)
	}

	return func(i interface{}) string {
		var c string
		if cc, ok := i.(string); ok {
			c = cc
		}
		if len(c) > 0 {
			c = filepath.Base(c)
			c = colorize(c, colorBold, noColor) + colorize(" >", colorCyan, noColor)
		}
		return c
	}
}
