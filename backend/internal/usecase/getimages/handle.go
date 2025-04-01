package getimages

import (
	"context"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/OkDenAl/humback-whale/internal/usecase/getimages/dto"
)

func (u UC) Handle(ctx context.Context, q Query) (QueryResult, error) {
	images, err := u.humpbackWhaleRepo.GetWhalesBeforeCursor(ctx, q.Limit, q.Cursor)
	if err != nil {
		return QueryResult{}, err
	}

	var (
		nextPageUrl *string
		prevPageUrl *string
	)

	if len(images) >= q.Limit {
		nextPageUrl = u.buildPageURL(q.Limit, images[len(images)-1].CreatedAt)
		images = images[:len(images)-1]
	}

	if q.Cursor != nil {
		img, err := u.humpbackWhaleRepo.GetWhalesAfterCursor(ctx, q.Limit, q.Cursor)
		if err != nil {
			return QueryResult{}, err
		}

		if len(img) > 0 {
			prevPageUrl = u.buildPageURL(q.Limit, img[0].CreatedAt)
		}
	}

	users, err := u.userRepo.GetUsersByIDs(ctx, u.userIDs(images))
	if err != nil {
		return QueryResult{}, err
	}

	imgInfo, err := u.imageRepo.GetMany(ctx, u.imageObjectIDs(images))
	if err != nil {
		return QueryResult{}, err
	}

	return QueryResult{
		WhaleImgs:   dto.NewHumpbackWhaleImage(images, users, imgInfo),
		NextPageURL: nextPageUrl,
		PrevPageURL: prevPageUrl,
	}, nil
}

func (u UC) buildPageURL(limit int, pageCursor time.Time) *string {
	urlStr := strings.ReplaceAll(u.cfg.GetWhaleImagesURLPageTemplate, limitTemplate, strconv.Itoa(limit))
	urlStr = strings.ReplaceAll(urlStr, cursorTemplate, pageCursor.Format(time.RFC3339Nano))
	return &urlStr
}

func (u UC) userIDs(images []*domain.HumpbackWhale) []uuid.UUID {
	var ids []uuid.UUID
	for _, img := range images {
		ids = append(ids, img.AuthorID)
	}

	return ids
}

func (u UC) imageObjectIDs(images []*domain.HumpbackWhale) []uuid.UUID {
	var ids []uuid.UUID
	for _, img := range images {
		ids = append(ids, img.ObjectID)
	}

	return ids
}
