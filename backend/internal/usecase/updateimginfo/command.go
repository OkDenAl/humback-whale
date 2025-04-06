package updateimginfo

import (
	"github.com/google/uuid"
	"github.com/pkg/errors"
)

type Command struct {
	ImgID       uuid.UUID
	Description string
	WhaleType   string
}

func NewCommand(imgID, description, whaleType string) (Command, error) {
	if imgID == "" {
		return Command{}, errors.Errorf("img id is empty")
	}

	imgUUID, err := uuid.Parse(imgID)
	if err != nil {
		return Command{}, errors.Wrap(err, "failed to parse img id")
	}

	if description == "" && whaleType == "" {
		return Command{}, errors.Errorf("description and whale type are empty")
	}

	return Command{
		ImgID:       imgUUID,
		Description: description,
		WhaleType:   whaleType,
	}, nil
}
