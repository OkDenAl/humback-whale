package dbview

import (
	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

//go:generate sqlview -table=site_user
type UserRecord struct {
	ID       uuid.UUID       `db:"id"`
	Email    string          `db:"email"`
	Username string          `db:"username"`
	Password string          `db:"password"`
	Role     domain.UserRole `db:"user_role"`
}

func UserRecordFromDomain(user *domain.User) UserRecord {
	return UserRecord{
		ID:       user.ID,
		Email:    user.Email,
		Username: user.Username,
		Password: user.Password,
		Role:     user.Role,
	}
}

func UserRecordToDomain(user UserRecord) *domain.User {
	return &domain.User{
		ID:       user.ID,
		Email:    user.Email,
		Username: user.Username,
		Password: user.Password,
		Role:     user.Role,
	}
}
