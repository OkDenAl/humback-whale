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
	ObjectID    uuid.UUID
	Gender      string
	WhaleName   string
	WhaleTypeID uuid.UUID
}

func NewHumpbackWhale(
	authorID uuid.UUID,
	longitude float64,
	latitude float64,
	description string,
	objectID uuid.UUID,
	sawAt time.Time,
	gender string,
	whaleName string,
	whaleTypeID uuid.UUID,
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
		ObjectID:    objectID,
		SawAt:       sawAt,
		Gender:      gender,
		WhaleName:   whaleName,
		WhaleTypeID: whaleTypeID,
	}
}

func (h *HumpbackWhale) Describe(description string) {
	if description != "" {
		h.Description = description
	}
}

func (h *HumpbackWhale) SpecifyWhaleType(whaleTypeID uuid.UUID) {
	h.WhaleTypeID = whaleTypeID
}
