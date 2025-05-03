package getwhaletypes

import (
	"context"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

// WhaleTypeRepo defines the methods needed from the repository layer.
type iWhaleTypeRepo interface {
	GetAllWhaleTypes(ctx context.Context) ([]*domain.WhaleType, error)
}

// UseCase handles the logic for getting whale types.
type UC struct {
	repo iWhaleTypeRepo
}

// New creates a new UseCase instance.
func New(repo iWhaleTypeRepo) *UC {
	return &UC{repo: repo}
}
