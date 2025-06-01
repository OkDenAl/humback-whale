package register

import (
	"context"
	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/google/uuid"
)

type iUserRepo interface {
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
	CreateUser(ctx context.Context, user *domain.User) error
	GetUserByUsername(ctx context.Context, username string) (*domain.User, error)
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
