package mlrecognizer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/benbjohnson/clock"
	"github.com/pkg/errors"

	"github.com/cenkalti/backoff/v3"
	"github.com/mercari/go-circuitbreaker"
)

type MlClient struct {
	cfg    ClientConfig
	client http.Client
	cb     *circuitbreaker.CircuitBreaker
}

func NewClient(cfg ClientConfig) MlClient {
	cb := circuitbreaker.New(
		circuitbreaker.WithClock(clock.New()),
		circuitbreaker.WithFailOnContextCancel(true),
		circuitbreaker.WithFailOnContextDeadline(true),
		circuitbreaker.WithHalfOpenMaxSuccesses(cfg.CircuitBreaker.HalfOpenMaxSuccesses),
		circuitbreaker.WithOpenTimeoutBackOff(backoff.NewExponentialBackOff()),
		circuitbreaker.WithCounterResetInterval(cfg.CircuitBreaker.CounterResetInterval),
		circuitbreaker.WithTripFunc(
			circuitbreaker.NewTripFuncFailureRate(cfg.CircuitBreaker.MinThreshold, cfg.CircuitBreaker.FailureRate),
		),
	)

	return MlClient{client: http.Client{}, cfg: cfg, cb: cb}
}

func (c MlClient) GetTokens(ctx context.Context, url string) (err error) {
	if !c.cb.Ready() {
		return errors.Wrap(circuitbreaker.ErrOpen, "failed to make request circuit breaker is open")
	}
	defer func() { err = c.cb.Done(ctx, err) }()

	m := map[string]interface{}{
		"url": url,
	}
	reqJSON, err := json.Marshal(m)
	if err != nil {
		return errors.Wrap(err, "failed to marshal req data")
	}

	var req *http.Request
	req, err = http.NewRequest(
		"GET", fmt.Sprintf("http://%s:%s/api/v1/recognize", c.cfg.Host, c.cfg.Port),
		bytes.NewBuffer(reqJSON),
	)
	if err != nil {
		return errors.Wrapf(err, "failed to create http request to %s", req.URL.String())
	}

	clientResp, err := c.client.Do(req)
	if err != nil {
		return errors.Wrapf(err, "failed to send http request to %s", req.URL.String())
	}
	defer clientResp.Body.Close()

	if clientResp.StatusCode != http.StatusOK {
		return errors.Errorf("failed to recognize whale, status code: %d", clientResp.StatusCode)
	}

	return nil
}
