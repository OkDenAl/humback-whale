package resetpassword

import (
	"context"
)

type iUserRepo interface {
	ValidatePasswordResetToken(ctx context.Context, token string) (string, error)
	UpdatePassword(ctx context.Context, userID string, newPassword string) error
	InvalidatePasswordResetToken(ctx context.Context, token string) error
}

type UC struct {
	repo iUserRepo
}

func New(repo iUserRepo) *UC {
	return &UC{repo: repo}
}
