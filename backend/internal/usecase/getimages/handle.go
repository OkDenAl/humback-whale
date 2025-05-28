package getimages

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/OkDenAl/humback-whale/pkg/logger"
)

func (u UC) Handle(ctx context.Context, q Query) (QueryResult, error) {
	log := logger.New()

	var authorID *uuid.UUID
	if q.Username != nil {
		user, err := u.userRepo.GetUserByUsername(ctx, *q.Username)
		if err != nil && !errors.Is(err, integrationerror.ErrUserNotFound) {
			return QueryResult{}, err
		}

		if errors.Is(err, integrationerror.ErrUserNotFound) {
			log.Warn().Err(err).Stack().Msg("failed to get user by nickname")
		}

		authorID = &user.ID
	}

	images, err := u.humpbackWhaleRepo.GetWhalesBeforeCursor(
		ctx,
		q.Limit,
		q.Cursor,
		authorID,
		q.WhaleTypeID,
		q.Gender,
		q.WhaleName,
	)
	if err != nil && !errors.Is(err, integrationerror.ErrHumpbackWhaleNotFound) {
		return QueryResult{}, err
	}

	if errors.Is(err, integrationerror.ErrHumpbackWhaleNotFound) {
		log.Warn().Err(err).Stack().Msg("failed to get images before cursor")
	}

	var (
		nextPageUrl *string
		prevPageUrl *string
	)
	if len(images) > q.Limit {
		nextPageUrl = u.buildPageURL(q.Limit, images[len(images)-1].CreatedAt, q)
		images = images[:len(images)-1]
	}

	if q.Cursor != nil {
		img, err := u.humpbackWhaleRepo.GetWhalesAfterCursor(
			ctx,
			q.Limit,
			q.Cursor,
			authorID,
			q.WhaleTypeID,
			q.Gender,
			q.WhaleName,
		)
		if err != nil && !errors.Is(err, integrationerror.ErrHumpbackWhaleNotFound) {
			return QueryResult{}, err
		}

		if errors.Is(err, integrationerror.ErrHumpbackWhaleNotFound) {
			log.Warn().Err(err).Stack().Msg("failed to get images after cursor")
		}

		if len(img) > 0 {
			prevPageUrl = u.buildPageURL(q.Limit, img[len(img)-1].CreatedAt, q)
		}
	}

	users, err := u.userRepo.GetUsersByIDs(ctx, u.userIDs(images))
	if err != nil && !errors.Is(err, integrationerror.ErrUserNotFound) {
		return QueryResult{}, err
	}

	imgInfo, err := u.imageRepo.GetMany(ctx, u.imageObjectIDs(images))
	if err != nil {
		return QueryResult{}, err
	}

	whaleTypes, err := u.waleTypeRepo.GetWhaleTypesByIDs(ctx, u.whaleTypeKeys(images))
	if err != nil && !errors.Is(err, integrationerror.ErrWhaleTypeNotFound) {
		return QueryResult{}, err
	}

	return QueryResult{
		WhaleImgs:   NewHumpbackWhaleImageDTO(images, users, imgInfo, whaleTypes),
		NextPageURL: nextPageUrl,
		PrevPageURL: prevPageUrl,
	}, nil
}

func (u UC) buildPageURL(limit int, pageCursor time.Time, q Query) *string {
	baseURL := strings.Split(u.cfg.GetWhaleImagesURLPageTemplate, "?")[0]
	params := []string{
		fmt.Sprintf("limit=%d", limit),
		fmt.Sprintf("cursor=%s", pageCursor.Format(time.RFC3339Nano)),
	}
	if q.Username != nil {
		params = append(params, fmt.Sprintf("username=%s", *q.Username))
	}
	if q.WhaleTypeID != nil {
		params = append(params, fmt.Sprintf("whale_type_id=%s", q.WhaleTypeID.String()))
	}
	if q.StartTimePeriod != nil {
		params = append(params, fmt.Sprintf("start_time=%s", q.StartTimePeriod.Format(time.RFC3339Nano)))
	}
	if q.EndTimePeriod != nil {
		params = append(params, fmt.Sprintf("end_time=%s", q.EndTimePeriod.Format(time.RFC3339Nano)))
	}

	urlStr := baseURL + "?" + strings.Join(params, "&")
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

func (u UC) whaleTypeKeys(images []*domain.HumpbackWhale) []uuid.UUID {
	keysMap := make(map[uuid.UUID]struct{})
	for _, img := range images {
		if img.WhaleTypeID.String() != "" {
			keysMap[img.WhaleTypeID] = struct{}{}
		}
	}

	keys := make([]uuid.UUID, 0, len(keysMap))
	for k := range keysMap {
		keys = append(keys, k)
	}
	return keys
}
