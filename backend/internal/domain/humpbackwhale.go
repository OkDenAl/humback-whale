package domain

import (
	"time"

	"github.com/google/uuid"
)

type HumpbackWhale struct {
	ID          uuid.UUID
	AuthorID    uuid.UUID
	CreatedAt   time.Time
	Longitude   float64
	Latitude    float64
	Description string
	WhaleType   string
	ObjectID    uuid.UUID
}

func NewHumpbackWhale(
	authorID uuid.UUID,
	longitude float64,
	latitude float64,
	description string,
	whaleType string,
	objectID uuid.UUID,
) *HumpbackWhale {
	return &HumpbackWhale{
		ID:          uuid.New(),
		AuthorID:    authorID,
		CreatedAt:   time.Now(),
		Longitude:   longitude,
		Latitude:    latitude,
		Description: description,
		WhaleType:   whaleType,
		ObjectID:    objectID,
	}
}
