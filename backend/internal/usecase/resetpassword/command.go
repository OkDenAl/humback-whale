package resetpassword

import (
	"github.com/pkg/errors"
)

type Command struct {
	Token    string
	Password string
}

func NewCommand(token, password string) (Command, error) {
	if token == "" {
		return Command{}, errors.Errorf("token is required")
	}

	if password == "" {
		return Command{}, errors.Errorf("password is required")
	}

	if len(password) < 6 {
		return Command{}, errors.Errorf("password must be at least 6 characters long")
	}

	return Command{
		Token:    token,
		Password: password,
	}, nil
} 