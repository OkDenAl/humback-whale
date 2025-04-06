package domain

import (
	"time"

	"github.com/google/uuid"
)

type HumpbackWhale struct {
	ID          uuid.UUID
	AuthorID    uuid.UUID
	CreatedAt   time.Time
	SawAt       time.Time
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
	sawAt time.Time,
) *HumpbackWhale {
	now := time.Now()

	if sawAt.IsZero() || sawAt.Unix() == 0 {
		sawAt = now
	}

	return &HumpbackWhale{
		ID:          uuid.New(),
		AuthorID:    authorID,
		CreatedAt:   now,
		Longitude:   longitude,
		Latitude:    latitude,
		Description: description,
		WhaleType:   whaleType,
		ObjectID:    objectID,
		SawAt:       sawAt,
	}
}

func (h *HumpbackWhale) Describe(description string) {
	if description != "" {
		h.Description = description
	}
}

func (h *HumpbackWhale) SpecifyWhaleType(whaleType string) {
	if whaleType != "" {
		h.WhaleType = whaleType
	}
}
