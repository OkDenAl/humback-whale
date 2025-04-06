package updateimginfo

import (
	"context"
	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

type iHumpbackWhaleRepo interface {
	GetWhaleByID(ctx context.Context, id uuid.UUID) (*domain.HumpbackWhale, error)
	SaveWhale(ctx context.Context, humpbackWhale *domain.HumpbackWhale) error
}

// UC обработчик команд, удовлетворяющих интерфейсу Command.
type UC struct {
	humpbackWhaleRepo iHumpbackWhaleRepo
}

// NewUC возвращает новый UC.
func NewUC(humpbackWhaleRepo iHumpbackWhaleRepo) *UC {
	return &UC{
		humpbackWhaleRepo: humpbackWhaleRepo,
	}
}
