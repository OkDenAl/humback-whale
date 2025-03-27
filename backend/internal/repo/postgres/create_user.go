package postgres

import (
	"context"

	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/OkDenAl/humback-whale/internal/repo/postgres/dbview"
)

func (r Repo) CreateUser(ctx context.Context, user *domain.User) error {
	view := dbview.UserRecordFromDomain(user)

	req, args, err := psql.Insert(dbview.SiteUserTableName).
		Columns(dbview.SiteUserFields().All()...).
		Values(view.Vals()...).
		ToSql()
	if err != nil {
		return errors.Wrap(err, "failed to create query to insert user")
	}

	if _, err = r.db.Exec(ctx, req, args...); err != nil {
		return errors.Wrap(err, "failed to create user")
	}

	return nil
}
