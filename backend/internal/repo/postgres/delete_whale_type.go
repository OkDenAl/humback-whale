package postgres

import (
	"context"

	sq "github.com/Masterminds/squirrel"
	"github.com/google/uuid"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/OkDenAl/humback-whale/internal/repo/postgres/dbview"
)

func (r Repo) DeleteWhaleType(ctx context.Context, whaleTypeID uuid.UUID) error {
	query, args, err := psql.Delete(dbview.WhaleTypeTableName).
		Where(sq.Eq{dbview.WhaleTypeFields().ID: whaleTypeID}).
		ToSql()
	if err != nil {
		return errors.Wrapf(err, "failed to build delete query for whale type %s", whaleTypeID)
	}

	cmdTag, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return errors.Wrapf(err, "failed to execute delete for whale type %s", whaleTypeID)
	}

	if cmdTag.RowsAffected() == 0 {
		return errors.Wrapf(integrationerror.ErrWhaleTypeNotFound, "whale %s not found for deletion", whaleTypeID)
	}

	return nil
}
