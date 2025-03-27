package mlrecognizer

import (
	"net/http"

	"github.com/hashicorp/go-retryablehttp"
)

type Repo struct {
	host   string
	client http.Client
}

func New(cfg ClientConfig) Repo {
	webClient := retryablehttp.NewClient()

	webClient.RetryWaitMin = cfg.BackoffTimeout
	webClient.RetryWaitMax = cfg.BackoffTimeoutMax
	webClient.RetryMax = cfg.RetryMax
	webClient.HTTPClient.Timeout = cfg.Timeout
	webClient.Backoff = retryablehttp.LinearJitterBackoff
	webClient.Logger = nil
	webClient.HTTPClient.Transport = newTransport(cfg)

	return Repo{client: http.Client{}, host: cfg.Host}
}

func newTransport(cfg ClientConfig) http.RoundTripper {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.MaxIdleConns = cfg.MaxIdleConns
	transport.MaxConnsPerHost = cfg.MaxConnsPerHost
	transport.MaxIdleConnsPerHost = cfg.MaxIdleConnsPerHost

	return applyMiddleware(transport, cfg)
}

// applyMiddleware applies various middleware to the http.RoundTripper.
func applyMiddleware(rt http.RoundTripper, cfg ClientConfig) http.RoundTripper {
	rt = NewLoggerTransport(rt)
	rt = NewCircuitBreakerTransport(rt, cfg.CircuitBreaker)

	return rt
}
