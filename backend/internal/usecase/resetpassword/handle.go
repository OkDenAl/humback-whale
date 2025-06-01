package resetpassword

import (
	"context"
	"golang.org/x/crypto/bcrypt"

	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/integrationerror"
)

func (uc *UC) Handle(ctx context.Context, cmd Command) error {
	userID, err := uc.repo.ValidatePasswordResetToken(ctx, cmd.Token)
	if err != nil {
		return errors.Wrap(err, "failed to validate token")
	}
	if userID == "" {
		return errors.Wrap(integrationerror.ErrInvalidToken, "token is invalid or expired")
	}

	hashed, err := hashAndSalt([]byte(cmd.Password))
	if err != nil {
		return err
	}

	if err := uc.repo.UpdatePassword(ctx, userID, hashed); err != nil {
		return errors.Wrap(err, "failed to update password")
	}

	if err := uc.repo.InvalidatePasswordResetToken(ctx, cmd.Token); err != nil {
		return errors.Wrap(err, "failed to invalidate token")
	}

	return nil
}

func hashAndSalt(pass []byte) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword(pass, bcrypt.MinCost)
	if err != nil {
		return "", errors.Wrap(err, "failed to hash password")
	}

	return string(hashed), nil
}
