package getimages

import (
	"time"

	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/usecase/getimages/dto"
)

type Query struct {
	Limit  int
	Cursor *time.Time
}

func NewQuery(limit int, cursor *time.Time) (Query, error) {
	if limit <= 0 {
		return Query{}, errors.Errorf("limit must be greater than 0")
	}

	return Query{
		Limit:  limit,
		Cursor: cursor,
	}, nil
}

type QueryResult struct {
	WhaleImgs   []dto.HumpbackWhaleImage
	NextPageURL *string
	PrevPageURL *string
}
