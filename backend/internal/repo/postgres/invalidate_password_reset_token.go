package postgres

import (
	"context"
	"fmt"

	sq "github.com/Masterminds/squirrel"
)

func (r Repo) InvalidatePasswordResetToken(ctx context.Context, token string) error {
	query, args, err := psql.Update("password_reset_token").
		Set("used", true).
		Where(sq.Eq{"token": token}).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build query: %w", err)
	}

	_, err = r.db.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to invalidate token: %w", err)
	}

	return nil
}
