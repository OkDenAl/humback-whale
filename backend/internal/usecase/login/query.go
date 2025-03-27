package login

import (
	"github.com/pkg/errors"
)

type Query struct {
	Email    string
	Password string
}

func NewQuery(email, password string) (Query, error) {
	if email == "" {
		return Query{}, errors.Errorf("email is empty")
	}

	if password == "" {
		return Query{}, errors.Errorf("password is empty")
	}

	return Query{
		Email:    email,
		Password: password,
	}, nil
}

type QueryResult struct {
	Token       string
	IsScientist bool
	Username    string
}
