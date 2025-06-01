package sendresetpassword

import (
	"context"
	"github.com/OkDenAl/humback-whale/internal/domain"

	"github.com/pkg/errors"
)

func (uc *UC) Handle(ctx context.Context, cmd Command) error {
	user, err := uc.repo.GetUserByEmail(ctx, cmd.Email)
	if err != nil {
		return errors.Wrap(err, "failed to get user by email")
	}

	resetToken := domain.NewPasswordResetToken(user.ID, cmd.Email)

	if err := uc.repo.CreatePasswordResetToken(ctx, resetToken); err != nil {
		return errors.Wrap(err, "failed to create password reset token")
	}

	if err := uc.emailSender.SendPasswordResetEmail(ctx, cmd.Email, resetToken.Token); err != nil {
		return errors.Wrap(err, "failed to send password reset email")
	}

	return nil
}
