package jwtgenerator

import (
	"context"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/pkg/errors"
)

func (s Service) ParseToken(_ context.Context, accessToken string) (uuid.UUID, string, error) {
	token, err := jwt.ParseWithClaims(accessToken, &tokenClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return 0, errors.Wrap(ErrInvalidSigningMethod, "failed to parse token")
		}

		return []byte(s.cfg.SigningKey), nil
	})
	if err != nil {
		return uuid.UUID{}, "", err
	}

	if !token.Valid {
		return uuid.UUID{}, "", errors.Wrap(fmt.Errorf("invalid token"), "failed to parse token")
	}

	claims := token.Claims.(*tokenClaims)
	if claims == nil {
		return uuid.UUID{}, "", errors.WithStack(fmt.Errorf("token claims are not of type *tokenClaims"))
	}

	return claims.UserID, claims.Role, nil
}
