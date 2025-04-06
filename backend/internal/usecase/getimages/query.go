package getimages

import (
	"time"

	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/usecase/getimages/dto"
)

type Query struct {
	Limit           int
	Cursor          *time.Time
	Username        *string
	WhaleType       *string
	StartTimePeriod *time.Time
	EndTimePeriod   *time.Time
}

func NewQuery(
	limit int,
	cursor *time.Time,
	username *string,
	whaleType *string,
	startTimePeriod *time.Time,
	endTimePeriod *time.Time,
) (Query, error) {
	if limit <= 0 {
		return Query{}, errors.Errorf("limit must be greater than 0")
	}

	return Query{
		Limit:           limit,
		Cursor:          cursor,
		Username:        username,
		WhaleType:       whaleType,
		StartTimePeriod: startTimePeriod,
		EndTimePeriod:   endTimePeriod,
	}, nil
}

type QueryResult struct {
	WhaleImgs   []dto.HumpbackWhaleImage
	NextPageURL *string
	PrevPageURL *string
}
