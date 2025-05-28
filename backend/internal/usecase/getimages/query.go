package getimages

import (
	"time"

	"github.com/google/uuid"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/pkg/ptr"
)

type Query struct {
	Limit           int
	Cursor          *time.Time
	Username        *string
	WhaleTypeID     *uuid.UUID
	StartTimePeriod *time.Time
	EndTimePeriod   *time.Time
	Gender          *string
	WhaleName       *string
}

func NewQuery(
	limit int,
	cursor *time.Time,
	username *string,
	whaleTypeID *string,
	startTimePeriod *time.Time,
	endTimePeriod *time.Time,
	gender *string,
	whaleName *string,
) (Query, error) {
	if limit <= 0 {
		return Query{}, errors.Errorf("limit must be greater than 0")
	}

	var (
		whaleTypeUUID uuid.UUID
		err           error
	)
	if whaleTypeID != nil {
		if whaleTypeUUID, err = uuid.Parse(*whaleTypeID); err != nil {
			return Query{}, errors.Errorf("invalid whale type id")
		}
	}

	return Query{
		Limit:           limit,
		Cursor:          cursor,
		Username:        username,
		WhaleTypeID:     ptr.NilIfZero(whaleTypeUUID),
		StartTimePeriod: startTimePeriod,
		EndTimePeriod:   endTimePeriod,
		Gender:          gender,
		WhaleName:       whaleName,
	}, nil
}

type QueryResult struct {
	WhaleImgs   []HumpbackWhaleImage
	NextPageURL *string
	PrevPageURL *string
}
