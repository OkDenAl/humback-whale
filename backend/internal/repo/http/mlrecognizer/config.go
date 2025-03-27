package mlrecognizer

import "time"

type ClientConfig struct {
	Host              string        `yaml:"host" validate:"required"`
	Timeout           time.Duration `yaml:"timeout" validate:"required"`
	BackoffTimeout    time.Duration `yaml:"backoff_timeout" validate:"required"`
	BackoffTimeoutMax time.Duration `yaml:"backoff_timeout_max" validate:"required"`
	RetryMax          int           `yaml:"retry_max"`

	MaxIdleConns        int                  `yaml:"max_idle_conns" validate:"required"`
	MaxConnsPerHost     int                  `yaml:"max_conns_per_host" validate:"required"`
	MaxIdleConnsPerHost int                  `yaml:"max_idle_conns_per_host" validate:"required"`
	CircuitBreaker      CircuitBreakerConfig `yaml:"circuit_breaker" validate:"required"`
}
