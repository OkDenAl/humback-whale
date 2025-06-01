package getwhaletypes

import (
	"context"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

type iWhaleTypeRepo interface {
	GetAllWhaleTypes(ctx context.Context) ([]*domain.WhaleType, error)
}

type UC struct {
	repo iWhaleTypeRepo
}

func New(repo iWhaleTypeRepo) *UC {
	return &UC{repo: repo}
}
