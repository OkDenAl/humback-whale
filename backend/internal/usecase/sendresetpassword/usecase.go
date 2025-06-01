package sendresetpassword

import (
	"context"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

type iUserRepo interface {
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
	CreatePasswordResetToken(ctx context.Context, resetToken *domain.PasswordResetToken) error
}

type iEmailSender interface {
	SendPasswordResetEmail(ctx context.Context, email, token string) error
}

type UC struct {
	repo        iUserRepo
	emailSender iEmailSender
}

func New(repo iUserRepo, emailSender iEmailSender) *UC {
	return &UC{
		repo:        repo,
		emailSender: emailSender,
	}
}
