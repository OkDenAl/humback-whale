package jwtgenerator

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type tokenClaims struct {
	jwt.RegisteredClaims
	UserID uuid.UUID
	Role   string
}

func (s Service) GenerateToken(userID uuid.UUID, role string) (string, error) {
	expiresAt := &jwt.NumericDate{
		Time: time.Now().Add(s.cfg.TokenTTL),
	}

	issuedAt := &jwt.NumericDate{
		Time: time.Now(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &tokenClaims{
		jwt.RegisteredClaims{
			ExpiresAt: expiresAt,
			IssuedAt:  issuedAt,
		},
		userID,
		role,
	})

	return token.SignedString([]byte(s.cfg.SigningKey))
}
