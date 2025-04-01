package register

import (
	"context"
	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/google/uuid"
)

type iUserRepo interface {
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
	CreateUser(ctx context.Context, user *domain.User) error
}

type iJWTGenerator interface {
	GenerateToken(ctx context.Context, userID uuid.UUID, role string) (string, error)
}

// UC обработчик команд, удовлетворяющих интерфейсу Command.
type UC struct {
	jwtGeneratorRepo iJWTGenerator
	userRepo         iUserRepo
}

// NewUC возвращает новый UC.
func NewUC(jwtGeneratorRepo iJWTGenerator, userRepo iUserRepo) *UC {
	return &UC{
		jwtGeneratorRepo: jwtGeneratorRepo,
		userRepo:         userRepo,
	}
}
