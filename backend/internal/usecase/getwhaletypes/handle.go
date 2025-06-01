package getwhaletypes

import (
	"context"
)

func (uc *UC) Handle(ctx context.Context) ([]*WhaleType, error) {
	types, err := uc.repo.GetAllWhaleTypes(ctx)
	if err != nil {
		return nil, err
	}

	return NewWhaleTypesDTO(types), nil
}
