package auth

import (
	"github.com/pkg/errors"
)

type Query struct {
	Token string
}

func NewQuery(token string) (Query, error) {
	if token == "" {
		return Query{}, errors.Errorf("token is empty")
	}

	return Query{Token: token}, nil
}

type QueryResult struct {
	AuthorID    string
	IsScientist bool
}
