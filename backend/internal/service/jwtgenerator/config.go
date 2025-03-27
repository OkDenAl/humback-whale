package jwtgenerator

import "time"

type Config struct {
	SigningKey string        `yaml:"signing_key" env:"SIGNING_KEY" validate:"required"`
	TokenTTL   time.Duration `yaml:"ttl" validate:"required"`
}
