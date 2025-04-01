package dbview

import (
	"time"

	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

//go:generate sqlview -table=humpback_whale
type HumpbackWhaleRecord struct {
	ID          uuid.UUID `db:"id"`
	AuthorID    uuid.UUID `db:"author_id"`
	CreatedAt   time.Time `db:"created_at"`
	Longitude   float64   `db:"longitude"`
	Latitude    float64   `db:"latitude"`
	Description string    `db:"description"`
	WhaleType   string    `db:"whale_type"`
	ObjectID    uuid.UUID `db:"object_id"`
}

func HumpbackWhaleRecordFromDomain(whale *domain.HumpbackWhale) HumpbackWhaleRecord {
	return HumpbackWhaleRecord{
		ID:          whale.ID,
		AuthorID:    whale.AuthorID,
		CreatedAt:   whale.CreatedAt,
		Longitude:   whale.Longitude,
		Latitude:    whale.Latitude,
		Description: whale.Description,
		WhaleType:   whale.WhaleType,
		ObjectID:    whale.ObjectID,
	}
}

func HumpbackWhaleRecordToDomain(whale HumpbackWhaleRecord) *domain.HumpbackWhale {
	return &domain.HumpbackWhale{
		ID:          whale.ID,
		AuthorID:    whale.AuthorID,
		CreatedAt:   whale.CreatedAt,
		Longitude:   whale.Longitude,
		Latitude:    whale.Latitude,
		Description: whale.Description,
		WhaleType:   whale.WhaleType,
		ObjectID:    whale.ObjectID,
	}
}

func HumpbackWhaleRecordsToDomain(whales []HumpbackWhaleRecord) []*domain.HumpbackWhale {
	res := make([]*domain.HumpbackWhale, 0, len(whales))
	for _, whale := range whales {
		res = append(res, HumpbackWhaleRecordToDomain(whale))
	}

	return res
}
