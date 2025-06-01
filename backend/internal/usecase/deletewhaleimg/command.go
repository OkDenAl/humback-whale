package deletewhaleimg

import (
	"github.com/google/uuid"
	"github.com/pkg/errors"
)

type Command struct {
	WhaleID uuid.UUID
}

func NewCommand(whaleID string) (Command, error) {
	if whaleID == "" {
		return Command{}, errors.Errorf("whale id is required")
	}

	whaleUUID, err := uuid.Parse(whaleID)
	if err != nil {
		return Command{}, errors.Wrap(err, "failed to parse whale id")
	}

	return Command{
		WhaleID: whaleUUID,
	}, nil
}
