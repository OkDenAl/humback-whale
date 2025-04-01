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

func (r Repo) GetUsersByIDs(ctx context.Context, ids []uuid.UUID) ([]*domain.User, error) {
	req, args, err := psql.Select(dbview.SiteUserFields().All()...).
		From(dbview.SiteUserTableName).
		Where(sq.Eq{
			dbview.SiteUserFields().ID: ids,
		}).ToSql()
	if err != nil {
		return nil, errors.Wrap(err, "failed to build query for getting users by ids")
	}

	var view []dbview.UserRecord
	if err = pgxscan.Select(ctx, r.db, &view, req, args...); err != nil {
		if pgxscan.NotFound(err) {
			return nil, errors.WithStack(integrationerror.ErrUserNotFound)
		}

		return nil, errors.Wrap(err, "failed to get users by id")
	}

	return dbview.UserRecordsToDomain(view), nil
}
