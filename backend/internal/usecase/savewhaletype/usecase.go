package savewhaletype

import (
	"context"

	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

// WhaleTypeRepo defines the methods needed from the repository layer.
type iWhaleTypeRepo interface {
	SaveWhaleType(ctx context.Context, whaleType *domain.WhaleType) error
	GetWhaleTypesByIDs(ctx context.Context, ids []uuid.UUID) ([]*domain.WhaleType, error)
}

// UseCase handles the logic for getting whale types.
type UC struct {
	repo iWhaleTypeRepo
}

// New creates a new UseCase instance.
func New(repo iWhaleTypeRepo) *UC {
	return &UC{repo: repo}
}
