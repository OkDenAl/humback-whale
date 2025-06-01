package postgres

import (
	"context"
	"fmt"

	sq "github.com/Masterminds/squirrel"

	"github.com/OkDenAl/humback-whale/internal/repo/postgres/dbview"
)

func (r Repo) UpdatePassword(ctx context.Context, userID string, newPassword string) error {
	query, args, err := psql.Update(dbview.SiteUserTableName).
		Set(dbview.SiteUserFields().Password, newPassword).
		Where(sq.Eq{dbview.SiteUserFields().ID: userID}).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build query: %w", err)
	}

	_, err = r.db.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}
