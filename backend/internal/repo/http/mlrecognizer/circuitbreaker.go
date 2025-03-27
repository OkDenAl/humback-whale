package mlrecognizer

import (
	"context"
	"net/http"
	"time"

	"github.com/benbjohnson/clock"
	"github.com/cenkalti/backoff/v3"
	"github.com/mercari/go-circuitbreaker"
	"github.com/pkg/errors"
)

type CircuitBreakerConfig struct {
	HalfOpenMaxSuccesses int64         `yaml:"half_open_max_successes" validate:"required,gt=0"`
	MinThreshold         int64         `yaml:"min_threshold" validate:"required,gt=0"`
	FailureRate          float64       `yaml:"failure_rate" validate:"required,gt=0"`
	ResetInterval        time.Duration `yaml:"reset_interval" validate:"required"`
}

var ErrNotSuccessfulResponse = errors.New("response code is not successful")

type CircuitBreakerTransport struct {
	rt http.RoundTripper
	cb *circuitbreaker.CircuitBreaker
}

func NewCircuitBreakerTransport(parent http.RoundTripper, cfg CircuitBreakerConfig) *CircuitBreakerTransport {
	return &CircuitBreakerTransport{
		rt: parent,
		cb: circuitbreaker.New(
			circuitbreaker.WithClock(clock.New()),
			circuitbreaker.WithFailOnContextCancel(true),
			circuitbreaker.WithFailOnContextDeadline(true),
			circuitbreaker.WithHalfOpenMaxSuccesses(cfg.HalfOpenMaxSuccesses),
			circuitbreaker.WithOpenTimeoutBackOff(backoff.NewExponentialBackOff()),
			circuitbreaker.WithCounterResetInterval(cfg.ResetInterval),
			circuitbreaker.WithTripFunc(
				circuitbreaker.NewTripFuncFailureRate(cfg.MinThreshold, cfg.FailureRate),
			),
		),
	}
}

func (cbt *CircuitBreakerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	ctx := req.Context()
	var (
		origResp *http.Response
		origErr  error
	)
	_, err := cbt.Do(ctx, func() (*http.Response, error) {
		origResp, origErr = cbt.rt.RoundTrip(req)
		if origErr != nil {
			return nil, origErr
		}
		if statusCodeTriggersCbError(origResp.StatusCode) {
			return nil, errors.Wrapf(ErrNotSuccessfulResponse, "status code: %d", origResp.StatusCode)
		}
		return origResp, nil
	})

	if errors.Is(err, circuitbreaker.ErrOpen) {
		return nil, err
	}

	return origResp, origErr
}

func statusCodeTriggersCbError(code int) bool {
	return code >= http.StatusInternalServerError || code == http.StatusTooManyRequests
}

func (cbt *CircuitBreakerTransport) Do(ctx context.Context, o func() (*http.Response, error)) (_ *http.Response, err error) {
	ready := cbt.cb.Ready()
	if !ready {
		return nil, errors.WithStack(circuitbreaker.ErrOpen)
	}

	defer func() {
		err = cbt.cb.Done(ctx, err)
	}()

	return o()
}
