package auth

import (
	"context"
	"github.com/OkDenAl/humback-whale/internal/domain"
)

func (uc UC) Handle(ctx context.Context, q Query) (QueryResult, error) {
	authorID, role, err := uc.jwtParserRepo.ParseToken(ctx, q.Token)
	if err != nil {
		return QueryResult{}, err
	}

	return QueryResult{
		AuthorID:    authorID.String(),
		IsScientist: domain.Role(role) == domain.UserRoleScientist,
	}, nil
}
