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
	WhaleType   string
	SawAt       time.Time
}

func NewCommand(img []byte, longitude, latitude float64, description, whaleType, authorID string, sawAt time.Time) (Command, error) {
	if authorID == "" {
		return Command{}, errors.Errorf("author_id is empty")
	}

	authorUUID, err := uuid.Parse(authorID)
	if err != nil {
		return Command{}, errors.Wrap(err, "failed to parse story id")
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
		WhaleType:   whaleType,
		SawAt:       sawAt,
	}, nil
}
