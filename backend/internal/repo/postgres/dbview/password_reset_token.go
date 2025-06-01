package dbview

import (
	"github.com/OkDenAl/humback-whale/internal/domain"
	"time"

	"github.com/google/uuid"
)

//go:generate sqlview -table=password_reset_token
type PasswordResetTokenRecord struct {
	Token     string    `db:"token"`
	UserID    uuid.UUID `db:"user_id"`
	Email     string    `db:"email"`
	CreatedAt time.Time `db:"created_at"`
	ExpiresAt time.Time `db:"expires_at"`
	Used      bool      `db:"used"`
}

func PasswordResetTokenRecordFromDomain(token *domain.PasswordResetToken) PasswordResetTokenRecord {
	return PasswordResetTokenRecord{
		Token:     token.Token,
		UserID:    token.UserID,
		Email:     token.Email,
		CreatedAt: token.CreatedAt,
		ExpiresAt: token.ExpiresAt,
		Used:      token.Used,
	}
}

func PasswordResetTokenRecordToDomain(token PasswordResetTokenRecord) *domain.PasswordResetToken {
	return &domain.PasswordResetToken{
		Token:     token.Token,
		UserID:    token.UserID,
		Email:     token.Email,
		CreatedAt: token.CreatedAt,
		ExpiresAt: token.ExpiresAt,
		Used:      token.Used,
	}
}
