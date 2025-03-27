package jwtgenerator

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/pkg/errors"
)

func (s Service) ParseToken(accessToken string) (uuid.UUID, error) {
	token, err := jwt.ParseWithClaims(accessToken, &tokenClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return 0, errors.Wrap(ErrInvalidSigningMethod, "failed to parse token")
		}

		return s.cfg.SigningKey, nil
	})
	if err != nil {
		return uuid.UUID{}, err
	}

	claims := token.Claims.(*tokenClaims)
	if claims == nil {
		return uuid.UUID{}, fmt.Errorf("token claims are not of type *tokenClaims")
	}

	return claims.UserID, nil
}
