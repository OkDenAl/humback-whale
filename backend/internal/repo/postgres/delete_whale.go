package postgres

import (
	"context"

	sq "github.com/Masterminds/squirrel"
	"github.com/google/uuid"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/OkDenAl/humback-whale/internal/repo/postgres/dbview"
)

// DeleteWhale removes a whale record from the database by its ID.
func (r Repo) DeleteWhale(ctx context.Context, whaleID uuid.UUID) error {
	query, args, err := psql.Delete(dbview.HumpbackWhaleTableName).
		Where(sq.Eq{dbview.HumpbackWhaleFields().ID: whaleID}).
		ToSql()
	if err != nil {
		return errors.Wrapf(err, "failed to build delete query for whale %s", whaleID)
	}

	cmdTag, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return errors.Wrapf(err, "failed to execute delete for whale %s", whaleID)
	}

	if cmdTag.RowsAffected() == 0 {
		return errors.Wrapf(integrationerror.ErrHumpbackWhaleNotFound, "whale %s not found for deletion", whaleID)
	}

	return nil
}
