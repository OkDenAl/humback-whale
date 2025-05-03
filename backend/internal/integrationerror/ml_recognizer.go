package integrationerror

import "github.com/pkg/errors"

var (
	ErrRecognizeWhale = errors.New("failed to recognize whale")
)
