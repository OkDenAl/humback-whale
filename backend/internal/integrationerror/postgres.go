package integrationerror

import "github.com/pkg/errors"

var ErrUserNotFound = errors.New("can't find user based on the specified parameters")
