package postgres

import (
	"context"
	"fmt"
	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/google/uuid"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/OkDenAl/humback-whale/internal/repo/postgres/dbview"
)

func (r Repo) GetWhalesBeforeCursor(ctx context.Context, limit int, cursor *time.Time, authorID *uuid.UUID, whaleTypeID *uuid.UUID) ([]*domain.HumpbackWhale, error) {
	b := psql.Select(dbview.HumpbackWhaleFields().All()...).From(dbview.HumpbackWhaleTableName)
	if authorID != nil {
		b = b.Where(sq.Eq{dbview.HumpbackWhaleFields().AuthorID: authorID})
	}
	if whaleTypeID != nil {
		b = b.Where(sq.Eq{dbview.HumpbackWhaleFields().WhaleTypeID: whaleTypeID})
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
		if pgxscan.NotFound(err) {
			return nil, errors.Wrapf(integrationerror.ErrHumpbackWhaleNotFound, "failed to get whale types by ids")
		}

		return nil, errors.Wrap(err, "failed to get whales images")
	}

	return dbview.HumpbackWhaleRecordsToDomain(view), nil
}

func (r Repo) GetWhalesAfterCursor(ctx context.Context, limit int, cursor *time.Time, authorID *uuid.UUID, whaleTypeID *uuid.UUID) ([]*domain.HumpbackWhale, error) {
	b := psql.Select(dbview.HumpbackWhaleFields().All()...).From(dbview.HumpbackWhaleTableName)
	if authorID != nil {
		b = b.Where(sq.Eq{dbview.HumpbackWhaleFields().AuthorID: authorID})
	}
	if whaleTypeID != nil {
		b = b.Where(sq.Eq{dbview.HumpbackWhaleFields().WhaleTypeID: whaleTypeID})
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
		if pgxscan.NotFound(err) {
			return nil, errors.Wrapf(integrationerror.ErrHumpbackWhaleNotFound, "failed to get whale types by ids")
		}

		return nil, errors.Wrap(err, "failed to get whales images")
	}

	return dbview.HumpbackWhaleRecordsToDomain(view), nil
}
