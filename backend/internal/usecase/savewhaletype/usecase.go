package savewhaletype

import (
	"context"

	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

type iWhaleTypeRepo interface {
	SaveWhaleType(ctx context.Context, whaleType *domain.WhaleType) error
	GetWhaleTypesByIDs(ctx context.Context, ids []uuid.UUID) ([]*domain.WhaleType, error)
}

type UC struct {
	repo iWhaleTypeRepo
}

func New(repo iWhaleTypeRepo) *UC {
	return &UC{repo: repo}
}
