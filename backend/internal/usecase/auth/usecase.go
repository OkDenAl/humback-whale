package auth

import (
	"context"
	"github.com/google/uuid"
)

type iJWTParser interface {
	ParseToken(ctx context.Context, accessToken string) (uuid.UUID, string, error)
}

// UC обработчик команд, удовлетворяющих интерфейсу Command.
type UC struct {
	jwtParserRepo iJWTParser
}

// NewUC возвращает новый UC.
func NewUC(jwtGeneratorRepo iJWTParser) *UC {
	return &UC{
		jwtParserRepo: jwtGeneratorRepo,
	}
}
