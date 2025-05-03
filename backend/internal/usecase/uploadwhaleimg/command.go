package uploadwhaleimg

import (
	"time"

	"github.com/google/uuid"
	"github.com/pkg/errors"
)

type Command struct {
	Img         []byte
	AuthorID    uuid.UUID
	Longitude   float64
	Latitude    float64
	Description string
	WhaleTypeID uuid.UUID
	SawAt       time.Time
	Name        string
	Gender      string
}

func NewCommand(img []byte, longitude, latitude float64, description, whaleTypeID, authorID string, sawAt time.Time, name, gender string) (Command, error) {
	if authorID == "" {
		return Command{}, errors.Errorf("author_id is empty")
	}

	authorUUID, err := uuid.Parse(authorID)
	if err != nil {
		return Command{}, errors.Wrap(err, "failed to parse story id")
	}

	var whaleTypeUUID uuid.UUID
	if whaleTypeID != "" {
		whaleTypeUUID, err = uuid.Parse(whaleTypeID)
		if err != nil {
			return Command{}, errors.Wrap(err, "failed to parse whale type ID")
		}
	}

	if len(img) == 0 {
		return Command{}, errors.Errorf("img is empty")
	}

	return Command{
		Img:         img,
		AuthorID:    authorUUID,
		Longitude:   longitude,
		Latitude:    latitude,
		Description: description,
		WhaleTypeID: whaleTypeUUID,
		SawAt:       sawAt,
		Name:        name,
		Gender:      gender,
	}, nil
}
