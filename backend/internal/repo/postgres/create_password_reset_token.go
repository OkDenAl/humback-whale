package postgres

import (
	"context"

	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/OkDenAl/humback-whale/internal/repo/postgres/dbview"
)

func (r Repo) CreatePasswordResetToken(ctx context.Context, resetToken *domain.PasswordResetToken) error {
	view := dbview.PasswordResetTokenRecordFromDomain(resetToken)

	query, args, err := psql.Insert(dbview.PasswordResetTokenTableName).
		Columns(dbview.PasswordResetTokenFields().All()...).
		Values(view.Vals()...).
		ToSql()
	if err != nil {
		return errors.Errorf("failed to build query: %w", err)
	}

	_, err = r.db.Exec(ctx, query, args...)
	if err != nil {
		return errors.Errorf("failed to create reset token: %w", err)
	}

	return nil
}
