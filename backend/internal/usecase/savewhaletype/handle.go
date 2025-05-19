package savewhaletype

import (
	"context"

	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

// Handle executes the use case logic.
func (uc *UC) Handle(ctx context.Context, cmd Command) error {
	var whaleType *domain.WhaleType
	if cmd.ID != uuid.Nil {
		wts, err := uc.repo.GetWhaleTypesByIDs(ctx, []uuid.UUID{cmd.ID})
		if err != nil {
			return err
		}
		whaleType = wts[0]
	}

	if whaleType == nil {
		whaleType = domain.NewWhaleType(
			cmd.SpeciesEng,
			cmd.SpeciesRus,
			cmd.Family,
			cmd.Genus,
			cmd.ConservationStatus,
		)
	} else {
		whaleType.Recreate(
			cmd.SpeciesEng,
			cmd.SpeciesRus,
			cmd.Family,
			cmd.Genus,
			cmd.ConservationStatus,
		)
	}

	return uc.repo.SaveWhaleType(ctx, whaleType)
}
