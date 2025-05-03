package postgres

import (
	"context"

	sq "github.com/Masterminds/squirrel"
	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/google/uuid"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/OkDenAl/humback-whale/internal/repo/postgres/dbview"
)

func (r Repo) GetWhaleByID(ctx context.Context, id uuid.UUID) (*domain.HumpbackWhale, error) {
	req, args, err := psql.Select(dbview.HumpbackWhaleFields().All()...).
		From(dbview.HumpbackWhaleTableName).
		Where(sq.Eq{
			dbview.HumpbackWhaleFields().ID: id,
		}).ToSql()
	if err != nil {
		return nil, errors.Wrap(err, "failed to build query for getting humpback whale by id")
	}

	var view dbview.HumpbackWhaleRecord
	if err = pgxscan.Get(ctx, r.db, &view, req, args...); err != nil {
		if pgxscan.NotFound(err) {
			return nil, errors.WithStack(integrationerror.ErrHumpbackWhaleNotFound)
		}

		return nil, errors.Wrap(err, "failed to get humpback whale by id")
	}

	return dbview.HumpbackWhaleRecordToDomain(view), nil
}
