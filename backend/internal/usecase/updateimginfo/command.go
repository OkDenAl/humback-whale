package updateimginfo

import (
	"github.com/google/uuid"
	"github.com/pkg/errors"
)

type Command struct {
	ImgID       uuid.UUID
	Description string
	Name        string
	Gender      string
	WhaleTypeID uuid.UUID
}

func NewCommand(imgID, description, whaleTypeID, name, gender string) (Command, error) {
	if imgID == "" {
		return Command{}, errors.Errorf("img id is empty")
	}

	imgUUID, err := uuid.Parse(imgID)
	if err != nil {
		return Command{}, errors.Wrap(err, "failed to parse img id")
	}

	var whaleTypeUUID uuid.UUID
	if whaleTypeID != "" {
		whaleTypeUUID, err = uuid.Parse(whaleTypeID)
		if err != nil {
			return Command{}, errors.Wrap(err, "failed to parse whale type id")
		}
	}

	return Command{
		ImgID:       imgUUID,
		Description: description,
		WhaleTypeID: whaleTypeUUID,
		Gender:      gender,
		Name:        name,
	}, nil
}
