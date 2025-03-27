package register

import (
	"context"
	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/google/uuid"
)

type iUserRepo interface {
	CreateUser(ctx context.Context, user *domain.User) error
}

type iJWTGenerator interface {
	GenerateToken(userID uuid.UUID, role string) (string, error)
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
