package mlrecognizer

import "time"

type ClientConfig struct {
	Host           string               `yaml:"host" validate:"required"`
	Port           string               `yaml:"port" validate:"required"`
	Timeout        time.Duration        `yaml:"timeout" validate:"required"`
	CircuitBreaker CircuitBreakerConfig `yaml:"circuit_breaker" validate:"required"`
}

type CircuitBreakerConfig struct {
	HalfOpenMaxSuccesses int64         `yaml:"half_open_max_successes" validate:"required,gt=0"`
	MinThreshold         int64         `yaml:"min_threshold" validate:"required,gt=0"`
	FailureRate          float64       `yaml:"failure_rate" validate:"required,gt=0"`
	CounterResetInterval time.Duration `yaml:"counter_reset_interval" validate:"required"`
}
