package postgres

import (
	"context"
	"github.com/OkDenAl/humback-whale/internal/integrationerror"

	sq "github.com/Masterminds/squirrel"
	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/OkDenAl/humback-whale/internal/repo/postgres/dbview"
)

func (r Repo) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	req, args, err := psql.Select(dbview.SiteUserFields().All()...).
		From(dbview.SiteUserTableName).
		Where(sq.Eq{
			dbview.SiteUserFields().Email: email,
		}).ToSql()
	if err != nil {
		return nil, errors.Wrap(err, "failed to build query for getting user by email")
	}

	var view dbview.UserRecord
	if err = pgxscan.Get(ctx, r.db, &view, req, args...); err != nil {
		if pgxscan.NotFound(err) {
			return nil, errors.WithStack(integrationerror.ErrUserNotFound)
		}

		return nil, errors.Wrap(err, "failed to get user by email")
	}

	return dbview.UserRecordToDomain(view), nil
}
