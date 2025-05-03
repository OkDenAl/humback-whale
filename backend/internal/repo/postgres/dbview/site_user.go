package dbview

import (
	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/OkDenAl/humback-whale/pkg/ptr"
)

//go:generate sqlview -table=site_user
type UserRecord struct {
	ID          uuid.UUID       `db:"id"`
	Email       string          `db:"email"`
	Username    string          `db:"username"`
	Password    string          `db:"password"`
	Role        domain.UserRole `db:"user_role"`
	Degree      *string         `db:"degree"`
	Rank        *string         `db:"rank"`
	PlaceOfWork *string         `db:"place_of_work"`
	IsVerified  bool            `db:"is_verified"`
}

func UserRecordFromDomain(user *domain.User) UserRecord {
	return UserRecord{
		ID:          user.ID,
		Email:       user.Email,
		Username:    user.Username,
		Password:    user.Password,
		Role:        user.Role,
		Degree:      ptr.NilIfZero(user.Degree),
		Rank:        ptr.NilIfZero(user.Rank),
		PlaceOfWork: ptr.NilIfZero(user.PlaceOfWork),
		IsVerified:  user.IsVerified,
	}
}

func UserRecordToDomain(user UserRecord) *domain.User {
	return &domain.User{
		ID:          user.ID,
		Email:       user.Email,
		Username:    user.Username,
		Password:    user.Password,
		Role:        user.Role,
		Degree:      ptr.Deref(user.Degree),
		Rank:        ptr.Deref(user.Rank),
		PlaceOfWork: ptr.Deref(user.PlaceOfWork),
		IsVerified:  user.IsVerified,
	}
}

func UserRecordsToDomain(users []UserRecord) []*domain.User {
	var result []*domain.User
	for _, user := range users {
		result = append(result, UserRecordToDomain(user))
	}

	return result
}
