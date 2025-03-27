package register

import (
	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/pkg/errors"
)

type Command struct {
	Email    string
	Password string
	Username string
	Role     domain.UserRole
}

func NewCommand(email, password, username, role string) (Command, error) {
	if email == "" {
		return Command{}, errors.Errorf("email is empty")
	}

	if password == "" {
		return Command{}, errors.Errorf("password is empty")
	}

	if username == "" {
		return Command{}, errors.Errorf("username is empty")
	}

	if role == "" {
		return Command{}, errors.Errorf("role is empty")
	}

	r := domain.Role(role)
	if r == domain.UnknownUserRole {
		return Command{}, errors.Errorf("role is invalid")
	}

	return Command{
		Email:    email,
		Password: password,
		Username: username,
		Role:     r,
	}, nil
}
