package register

import (
	"context"
	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/pkg/errors"

	"golang.org/x/crypto/bcrypt"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

func (uc UC) Handle(ctx context.Context, cmd Command) (string, error) {
	_, err := uc.userRepo.GetUserByEmail(ctx, cmd.Email)
	if err != nil && !errors.Is(err, integrationerror.ErrUserNotFound) {
		return "", err
	}
	if err == nil {
		return "", integrationerror.ErrUserAlreadyExists
	}

	hashed, err := hashAndSalt([]byte(cmd.Password))
	if err != nil {
		return "", err
	}

	user := domain.NewUser(cmd.Email, cmd.Username, hashed, cmd.Role)

	if err = uc.userRepo.CreateUser(ctx, user); err != nil {
		return "", err
	}

	return uc.jwtGeneratorRepo.GenerateToken(ctx, user.ID, user.Role.String())
}

func hashAndSalt(pass []byte) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword(pass, bcrypt.MinCost)
	if err != nil {
		return "", errors.Wrap(err, "failed to hash password")
	}

	return string(hashed), nil
}
