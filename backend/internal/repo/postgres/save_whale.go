package postgres

import (
	"context"

	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/OkDenAl/humback-whale/internal/repo/postgres/dbview"
	"github.com/OkDenAl/humback-whale/pkg/sqlex"
)

func (r Repo) SaveWhale(ctx context.Context, humpbackWhale *domain.HumpbackWhale) error {
	view := dbview.HumpbackWhaleRecordFromDomain(humpbackWhale)

	req, args, err := psql.Insert(dbview.HumpbackWhaleTableName).
		Columns(dbview.HumpbackWhaleFields().All()...).
		Values(view.Vals()...).
		Suffix(sqlex.OnConflict(dbview.HumpbackWhaleFields().ID).DoUpdateSet(dbview.HumpbackWhaleFields().All()...)).
		ToSql()
	if err != nil {
		return errors.Wrap(err, "failed to create query to upsert humpback whale")
	}

	if _, err = r.db.Exec(ctx, req, args...); err != nil {
		return errors.Wrap(err, "failed to save humpback whale")
	}

	return nil
}
