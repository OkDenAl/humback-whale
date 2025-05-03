package postgres

import (
	"context"

	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/OkDenAl/humback-whale/internal/repo/postgres/dbview"
	"github.com/OkDenAl/humback-whale/pkg/sqlex"
)

func (r Repo) CreateWhaleType(ctx context.Context, whaleType *domain.WhaleType) error {
	view := dbview.WhaleTypeRecordFromDomain(whaleType)

	req, args, err := psql.Insert(dbview.WhaleTypeTableName).
		Columns(dbview.WhaleTypeFields().All()...).
		Values(view.Vals()...).
		Suffix(sqlex.OnConflict(dbview.WhaleTypeFields().ID).DoUpdateSet(dbview.WhaleTypeFields().All()...)).
		ToSql()
	if err != nil {
		return errors.Wrap(err, "failed to create query to upsert whale type")
	}

	if _, err = r.db.Exec(ctx, req, args...); err != nil {
		return errors.Wrap(err, "failed to save whale type")
	}

	return nil
}
