package deletewhaletype

import (
	"github.com/google/uuid"
	"github.com/pkg/errors"
)

type Command struct {
	WhaleTypeID uuid.UUID
}

func NewCommand(whaleTypeID string) (Command, error) {
	if whaleTypeID == "" {
		return Command{}, errors.Errorf("whale type id is required")
	}

	whaleTypeUUID, err := uuid.Parse(whaleTypeID)
	if err != nil {
		return Command{}, errors.Wrap(err, "failed to parse whale type id")
	}

	return Command{
		WhaleTypeID: whaleTypeUUID,
	}, nil
}
