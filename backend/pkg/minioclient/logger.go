package minioclient

import (
	"net/http"
	"time"

	"github.com/OkDenAl/humback-whale/pkg/logger"
)

type LoggingTransport struct {
	Transport http.RoundTripper
}

func (t *LoggingTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	start := time.Now()
	res, err := t.Transport.RoundTrip(req)

	log := logger.New()
	if err != nil {
		log = log.With().Stack().Err(err).Logger()
	}

	log.Info().
		Str("method:", req.Method).
		Str("path", req.URL.Path).
		Dur("request_duration", time.Since(start)).
		Bool("success", err == nil).
		Msg("minio query executed")

	return res, nil
}
