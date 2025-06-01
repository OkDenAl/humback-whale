package login

import (
	"context"
	"github.com/google/uuid"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

var ErrInvalidPassword = errors.New("invalid password")

type iUserRepo interface {
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
}

type iJWTGenerator interface {
	GenerateToken(ctx context.Context, userID uuid.UUID, role string) (string, error)
}

type UC struct {
	jwtGeneratorRepo iJWTGenerator
	userRepo         iUserRepo
}

func NewUC(jwtGeneratorRepo iJWTGenerator, userRepo iUserRepo) *UC {
	return &UC{
		jwtGeneratorRepo: jwtGeneratorRepo,
		userRepo:         userRepo,
	}
}
