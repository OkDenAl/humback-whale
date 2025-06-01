package integrationerror

import "github.com/pkg/errors"

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrInvalidToken      = errors.New("invalid or expired token")

	ErrHumpbackWhaleNotFound = errors.New("humpback whale not found")

	ErrWhaleTypeNotFound = errors.New("can't find humpback whale type based on the specified parameters")
)
