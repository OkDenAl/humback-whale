package deletewhaleimg

import (
	"context"

	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

type iWhaleRepo interface {
	GetWhaleByID(ctx context.Context, whaleID uuid.UUID) (*domain.HumpbackWhale, error)
	DeleteWhale(ctx context.Context, whaleID uuid.UUID) error
}

type iImageStorageRepo interface {
	DeleteImage(ctx context.Context, imageKey string) error
}

// UC handles the logic for deleting a whale image.
type UC struct {
	whaleRepo   iWhaleRepo
	storageRepo iImageStorageRepo
}

// New creates a new UC instance.
func New(whaleRepo iWhaleRepo, storageRepo iImageStorageRepo) *UC {
	return &UC{
		whaleRepo:   whaleRepo,
		storageRepo: storageRepo,
	}
}
