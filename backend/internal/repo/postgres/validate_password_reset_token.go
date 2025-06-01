package postgres

import (
	"context"
	"github.com/pkg/errors"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/jackc/pgx/v5"
)

func (r Repo) ValidatePasswordResetToken(ctx context.Context, token string) (string, error) {
	var userID string
	query, args, err := psql.Select("user_id").
		From("password_reset_token").
		Where(sq.Eq{"token": token}).
		Where("expires_at > ?", time.Now()).
		Where(sq.Eq{"used": false}).
		ToSql()
	if err != nil {
		return "", errors.Errorf("failed to build query: %w", err)
	}

	err = r.db.QueryRow(ctx, query, args...).Scan(&userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", nil
		}
		return "", errors.Errorf("failed to validate token: %w", err)
	}

	return userID, nil
}
