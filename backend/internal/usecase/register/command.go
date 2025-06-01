package register

import (
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

type Command struct {
	Email       string
	Password    string
	Username    string
	Role        domain.UserRole
	Degree      string
	Rank        string
	PlaceOfWork string
}

func NewCommand(
	email, password, username, role string,
	degree, rank, placeOfWork string,
) (Command, error) {
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
		Email:       email,
		Password:    password,
		Username:    username,
		Role:        r,
		Degree:      degree,
		Rank:        rank,
		PlaceOfWork: placeOfWork,
	}, nil
}

type Result struct {
	Token       string
	IsScientist bool
	Username    string
}
