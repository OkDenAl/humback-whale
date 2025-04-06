package postgres

import (
	"context"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/google/uuid"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/OkDenAl/humback-whale/internal/repo/postgres/dbview"
)

func (r Repo) GetWhalesBeforeCursor(ctx context.Context, limit int, cursor *time.Time, authorID *uuid.UUID, whaleType *string) ([]*domain.HumpbackWhale, error) {
	b := psql.Select(dbview.HumpbackWhaleFields().All()...).From(dbview.HumpbackWhaleTableName)
	if authorID != nil {
		b = b.Where(sq.Eq{dbview.HumpbackWhaleFields().AuthorID: authorID})
	}
	if whaleType != nil {
		b = b.Where(sq.Eq{dbview.HumpbackWhaleFields().WhaleType: whaleType})
	}
	if cursor != nil {
		b = b.Where(sq.LtOrEq{dbview.HumpbackWhaleFields().CreatedAt: cursor})
	}

	req, args, err := b.OrderBy(fmt.Sprintf("%s DESC", dbview.HumpbackWhaleFields().CreatedAt)).
		Limit(uint64(limit) + 1).
		ToSql()
	if err != nil {
		return nil, errors.Wrap(err, "failed to build query for getting whales")
	}

	var view []dbview.HumpbackWhaleRecord
	if err = pgxscan.Select(ctx, r.db, &view, req, args...); err != nil {
		return nil, errors.Wrap(err, "failed to get whales images")
	}
	// pgxscan.Select does not return any error on empty selection.
	if len(view) == 0 {
		return nil, errors.Wrap(integrationerror.ErrHumpbackWhaleNotFound, "failed to get whales images before cursor")
	}

	return dbview.HumpbackWhaleRecordsToDomain(view), nil
}

func (r Repo) GetWhalesAfterCursor(ctx context.Context, limit int, cursor *time.Time, authorID *uuid.UUID, whaleType *string) ([]*domain.HumpbackWhale, error) {
	b := psql.Select(dbview.HumpbackWhaleFields().All()...).From(dbview.HumpbackWhaleTableName)
	if authorID != nil {
		b = b.Where(sq.Eq{dbview.HumpbackWhaleFields().AuthorID: authorID})
	}
	if whaleType != nil {
		b = b.Where(sq.Eq{dbview.HumpbackWhaleFields().WhaleType: whaleType})
	}
	if cursor != nil {
		b = b.Where(sq.Gt{dbview.HumpbackWhaleFields().CreatedAt: cursor})
	}

	req, args, err := b.OrderBy(fmt.Sprintf("%s ASC", dbview.HumpbackWhaleFields().CreatedAt)).
		Limit(uint64(limit)).
		ToSql()
	if err != nil {
		return nil, errors.Wrap(err, "failed to build query for getting whales")
	}

	var view []dbview.HumpbackWhaleRecord
	if err = pgxscan.Select(ctx, r.db, &view, req, args...); err != nil {
		return nil, errors.Wrap(err, "failed to get whales images")
	}

	return dbview.HumpbackWhaleRecordsToDomain(view), nil
}
