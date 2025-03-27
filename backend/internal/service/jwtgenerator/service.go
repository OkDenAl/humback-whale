package jwtgenerator

import (
	"errors"
)

var ErrInvalidSigningMethod = errors.New("invalid signing method")

type Service struct {
	cfg Config
}

func New(cfg Config) *Service {
	return &Service{cfg: cfg}
}
