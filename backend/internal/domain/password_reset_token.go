package domain

import (
	"time"

	"github.com/google/uuid"
)

type PasswordResetToken struct {
	Token     string
	UserID    uuid.UUID
	Email     string
	CreatedAt time.Time
	ExpiresAt time.Time
	Used      bool
}

func NewPasswordResetToken(userID uuid.UUID, email string) *PasswordResetToken {
	now := time.Now()
	return &PasswordResetToken{
		Token:     uuid.New().String(),
		UserID:    userID,
		Email:     email,
		CreatedAt: now,
		ExpiresAt: now.Add(time.Hour),
		Used:      false,
	}
}

func (t *PasswordResetToken) IsExpired() bool {
	return time.Now().After(t.ExpiresAt)
}

func (t *PasswordResetToken) IsValid() bool {
	return !t.IsExpired() && !t.Used
}
