package login

import (
	"context"
	"github.com/OkDenAl/humback-whale/internal/domain"

	"github.com/pkg/errors"
	"golang.org/x/crypto/bcrypt"
)

func (uc UC) Handle(ctx context.Context, q Query) (QueryResult, error) {
	user, err := uc.userRepo.GetUserByEmail(ctx, q.Email)
	if err != nil {
		return QueryResult{}, err
	}

	if err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(q.Password)); err != nil {
		return QueryResult{}, errors.Wrap(ErrInvalidPassword, "failed to compare password")
	}

	token, err := uc.jwtGeneratorRepo.GenerateToken(ctx, user.ID, user.Role.String())
	if err != nil {
		return QueryResult{}, err
	}

	return QueryResult{
		Token:       token,
		IsScientist: user.Role == domain.UserRoleScientist,
		Username:    user.Username,
	}, nil
}
