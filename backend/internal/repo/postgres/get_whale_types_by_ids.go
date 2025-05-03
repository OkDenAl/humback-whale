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

func (r Repo) GetWhaleTypesByIDs(ctx context.Context, ids []uuid.UUID) ([]*domain.WhaleType, error) {
	query, args, err := psql.Select(dbview.WhaleTypeFields().All()...).
		From(dbview.WhaleTypeTableName).
		Where(sq.Eq{dbview.WhaleTypeFields().ID: ids}).
		ToSql()
	if err != nil {
		return nil, errors.Wrapf(err, "failed to build select query for whale types by ids")
	}

	var view []dbview.WhaleTypeRecord
	if err = pgxscan.Get(ctx, r.db, &view, query, args...); err != nil {
		if pgxscan.NotFound(err) {
			return nil, errors.Wrapf(integrationerror.ErrWhaleTypeNotFound, "failed to get whale types by ids")
		}

		return nil, errors.Wrapf(err, "failed to execute select for whale types by ids")
	}

	return dbview.WhaleTypeRecordsToDomain(view), nil
}
