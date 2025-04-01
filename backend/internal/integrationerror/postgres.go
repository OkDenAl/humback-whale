package integrationerror

import "github.com/pkg/errors"

var (
	ErrUserNotFound      = errors.New("can't find user based on the specified parameters")
	ErrUserAlreadyExists = errors.New("user already exists")

	ErrHumpbackWhaleNotFound = errors.New("can't find humpback whale image based on the specified parameters")
)
