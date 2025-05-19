package domain

import "context"
 
// DeleteWhaleTypeUseCase defines the interface for deleting a whale type
type DeleteWhaleTypeUseCase interface {
	Delete(ctx context.Context, id string) error
} 