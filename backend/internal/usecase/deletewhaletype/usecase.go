package deletewhaletype

import (
	"context"
	"github.com/google/uuid"
)

// WhaleTypeRepo defines the methods needed from the repository layer.
type iWhaleTypeRepo interface {
	DeleteWhaleType(ctx context.Context, whaleTypeID uuid.UUID) error
}

// UseCase handles the logic for getting whale types.
type UC struct {
	repo iWhaleTypeRepo
}

// New creates a new UseCase instance.
func New(repo iWhaleTypeRepo) *UC {
	return &UC{repo: repo}
}
