package register

import (
	"context"
	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/pkg/errors"

	"golang.org/x/crypto/bcrypt"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

func (uc UC) Handle(ctx context.Context, cmd Command) (Result, error) {
	_, err := uc.userRepo.GetUserByEmail(ctx, cmd.Email)
	if err != nil && !errors.Is(err, integrationerror.ErrUserNotFound) {
		return Result{}, err
	}
	if err == nil {
		return Result{}, integrationerror.ErrUserAlreadyExists
	}

	_, err = uc.userRepo.GetUserByUsername(ctx, cmd.Username)
	if err != nil && !errors.Is(err, integrationerror.ErrUserNotFound) {
		return Result{}, err
	}
	if err == nil {
		return Result{}, integrationerror.ErrUserAlreadyExists
	}

	hashed, err := hashAndSalt([]byte(cmd.Password))
	if err != nil {
		return Result{}, err
	}

	user := domain.NewUser(cmd.Email, cmd.Username, hashed, cmd.Role, cmd.Degree, cmd.Rank, cmd.PlaceOfWork)

	if err = uc.userRepo.CreateUser(ctx, user); err != nil {
		return Result{}, err
	}

	token, err := uc.jwtGeneratorRepo.GenerateToken(ctx, user.ID, user.Role.String())
	if err != nil {
		return Result{}, err
	}

	return Result{
		Token:       token,
		Username:    cmd.Username,
		IsScientist: cmd.Role == domain.UserRoleScientist,
	}, nil
}

func hashAndSalt(pass []byte) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword(pass, bcrypt.MinCost)
	if err != nil {
		return "", errors.Wrap(err, "failed to hash password")
	}

	return string(hashed), nil
}
