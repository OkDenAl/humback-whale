package mlrecognizer

import (
	"net/http"
)

type Repo struct {
	host   string
	client *http.Client
}

func New(cfg ClientConfig) Repo {
	return Repo{client: &http.Client{Transport: newTransport(cfg)}, host: cfg.Host}
}

func newTransport(cfg ClientConfig) http.RoundTripper {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.MaxIdleConns = cfg.MaxIdleConns
	transport.MaxConnsPerHost = cfg.MaxConnsPerHost
	transport.MaxIdleConnsPerHost = cfg.MaxIdleConnsPerHost

	return applyMiddleware(transport, cfg)
}

func applyMiddleware(rt http.RoundTripper, cfg ClientConfig) http.RoundTripper {
	rt = NewLoggerTransport(rt)
	rt = NewCircuitBreakerTransport(rt, cfg.CircuitBreaker)

	return rt
}
