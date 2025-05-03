package postgres

import (
	"context"
	"fmt"
	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/OkDenAl/humback-whale/internal/repo/postgres/dbview"
	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/pkg/errors"
)

func (r Repo) GetAllWhaleTypes(ctx context.Context) ([]*domain.WhaleType, error) {
	query, args, err := psql.Select(dbview.WhaleTypeFields().All()...).
		From(dbview.WhaleTypeTableName).
		OrderBy("species_rus ASC").
		ToSql()
	if err != nil {
		return nil, errors.Wrap(err, "failed to build select all query for whale types")
	}

	var view []dbview.WhaleTypeRecord
	err = pgxscan.Select(ctx, r.db, &view, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to execute select all for whale types: %w", err)
	}

	return dbview.WhaleTypeRecordsToDomain(view), nil
}
