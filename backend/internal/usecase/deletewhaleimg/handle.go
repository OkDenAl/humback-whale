package deletewhaleimg

import (
	"context"
	"github.com/OkDenAl/humback-whale/pkg/logger"

	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/integrationerror"
)

// Handle executes the use case logic.
func (uc *UC) Handle(ctx context.Context, cmd Command) error {
	whale, err := uc.whaleRepo.GetWhaleByID(ctx, cmd.WhaleID)
	if err != nil {
		if errors.Is(err, integrationerror.ErrHumpbackWhaleNotFound) {
			return nil
		}

		return errors.Wrap(err, "failed to get whale by id")
	}

	if err = uc.storageRepo.DeleteImage(ctx, whale.ObjectID.String()); err != nil {
		log := logger.New()
		log.Error().Stack().Msg("failed to delete image from storage")
	}

	err = uc.whaleRepo.DeleteWhale(ctx, cmd.WhaleID)
	if err != nil {
		if errors.Is(err, integrationerror.ErrHumpbackWhaleNotFound) {
			return nil
		}
		return errors.Wrap(err, "failed to delete whale from database")
	}

	return nil
}
