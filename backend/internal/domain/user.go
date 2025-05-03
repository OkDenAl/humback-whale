package domain

import "github.com/google/uuid"

type UserRole string

const (
	UnknownUserRole UserRole = "unknown"

	UserRoleScientist UserRole = "scientist"
	UserRoleUser      UserRole = "user"
)

func (u UserRole) String() string {
	switch u {
	case UserRoleScientist:
		return string(UserRoleScientist)
	case UserRoleUser:
		return string(UserRoleUser)
	}

	return string(UnknownUserRole)
}

func Role(s string) UserRole {
	switch s {
	case string(UserRoleScientist):
		return UserRoleScientist
	case string(UserRoleUser):
		return UserRoleUser
	}

	return UnknownUserRole
}

type User struct {
	ID          uuid.UUID
	Email       string
	Username    string
	Password    string
	Role        UserRole
	Degree      string
	Rank        string
	PlaceOfWork string
	IsVerified  bool
}

func NewUser(email, username, password string, role UserRole, degree, rank, placeOfWork string) *User {
	return &User{
		ID:          uuid.New(),
		Email:       email,
		Username:    username,
		Password:    password,
		Role:        role,
		Degree:      degree,
		Rank:        rank,
		PlaceOfWork: placeOfWork,
		IsVerified:  false,
	}
}
