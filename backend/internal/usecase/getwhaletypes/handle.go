package getwhaletypes

import (
	"context"
	"github.com/OkDenAl/humback-whale/internal/domain"
)

// Handle executes the use case logic.
func (uc *UC) Handle(ctx context.Context) ([]*domain.WhaleType, error) {
	return uc.repo.GetAllWhaleTypes(ctx)
}
