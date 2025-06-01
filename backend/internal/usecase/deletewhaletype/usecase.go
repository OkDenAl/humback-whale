package deletewhaletype

import (
	"context"
	"github.com/google/uuid"
)

type iWhaleTypeRepo interface {
	DeleteWhaleType(ctx context.Context, whaleTypeID uuid.UUID) error
}

type UC struct {
	repo iWhaleTypeRepo
}

func New(repo iWhaleTypeRepo) *UC {
	return &UC{repo: repo}
}
