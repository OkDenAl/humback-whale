package deletewhaletype

import (
	"context"
	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/pkg/errors"
)

// Handle executes the use case logic.
func (uc *UC) Handle(ctx context.Context, cmd Command) error {
	err := uc.repo.DeleteWhaleType(ctx, cmd.WhaleTypeID)
	if err != nil && errors.Is(err, integrationerror.ErrWhaleTypeNotFound) {
		return nil
	}

	return err
}
