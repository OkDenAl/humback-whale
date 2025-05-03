package dbview

import (
	"github.com/OkDenAl/humback-whale/pkg/ptr"
	"time"

	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

//go:generate sqlview -table=humpback_whale
type HumpbackWhaleRecord struct {
	ID          uuid.UUID  `db:"id"`
	AuthorID    uuid.UUID  `db:"author_id"`
	CreatedAt   time.Time  `db:"created_at"`
	SawAt       time.Time  `db:"saw_at"`
	Longitude   float64    `db:"longitude"`
	Latitude    float64    `db:"latitude"`
	Description string     `db:"description"`
	WhaleTypeID *uuid.UUID `db:"whale_type_id"`
	ObjectID    uuid.UUID  `db:"object_id"`
	WhaleName   string     `db:"whale_name"`
	Gender      string     `db:"gender"`
}

func HumpbackWhaleRecordFromDomain(whale *domain.HumpbackWhale) HumpbackWhaleRecord {
	return HumpbackWhaleRecord{
		ID:          whale.ID,
		AuthorID:    whale.AuthorID,
		CreatedAt:   whale.CreatedAt,
		Longitude:   whale.Longitude,
		Latitude:    whale.Latitude,
		Description: whale.Description,
		WhaleTypeID: ptr.NilIfZero(whale.WhaleTypeID),
		ObjectID:    whale.ObjectID,
		SawAt:       whale.SawAt,
		Gender:      whale.Gender,
		WhaleName:   whale.WhaleName,
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
		WhaleTypeID: ptr.Deref(whale.WhaleTypeID),
		ObjectID:    whale.ObjectID,
		SawAt:       whale.SawAt,
		Gender:      whale.Gender,
		WhaleName:   whale.WhaleName,
	}
}

func HumpbackWhaleRecordsToDomain(whales []HumpbackWhaleRecord) []*domain.HumpbackWhale {
	res := make([]*domain.HumpbackWhale, 0, len(whales))
	for _, whale := range whales {
		res = append(res, HumpbackWhaleRecordToDomain(whale))
	}

	return res
}
