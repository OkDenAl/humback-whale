package sendresetpassword

import (
	"github.com/pkg/errors"
)

type Command struct {
	Email string
}

func NewCommand(email string) (Command, error) {
	if email == "" {
		return Command{}, errors.Errorf("email is required")
	}

	return Command{
		Email: email,
	}, nil
} 