package auth

import (
	"context"
	"github.com/google/uuid"
)

type iJWTParser interface {
	ParseToken(ctx context.Context, accessToken string) (uuid.UUID, string, error)
}

type UC struct {
	jwtParserRepo iJWTParser
}

func NewUC(jwtGeneratorRepo iJWTParser) *UC {
	return &UC{
		jwtParserRepo: jwtGeneratorRepo,
	}
}
