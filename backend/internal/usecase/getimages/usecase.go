package getimages

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

type iUserRepo interface {
	GetUsersByIDs(ctx context.Context, ids []uuid.UUID) ([]*domain.User, error)
	GetUserByUsername(ctx context.Context, username string) (*domain.User, error)
}

type iHumpbackWhaleRepo interface {
	GetWhalesBeforeCursor(ctx context.Context, limit int, cursor *time.Time, authorID *uuid.UUID, whaleType *string) ([]*domain.HumpbackWhale, error)
	GetWhalesAfterCursor(ctx context.Context, limit int, cursor *time.Time, authorID *uuid.UUID, whaleType *string) ([]*domain.HumpbackWhale, error)
}

type iImageRepo interface {
	GetMany(ctx context.Context, objectIDs []uuid.UUID) ([]domain.ImageInfo, error)
}

// UC обработчик команд, удовлетворяющих интерфейсу Command.
type UC struct {
	cfg               Config
	humpbackWhaleRepo iHumpbackWhaleRepo
	userRepo          iUserRepo
	imageRepo         iImageRepo
}

// NewUC возвращает новый UC.
func NewUC(cfg Config, humpbackWhaleRepo iHumpbackWhaleRepo, userRepo iUserRepo, imageRepo iImageRepo) *UC {
	return &UC{
		cfg:               cfg,
		humpbackWhaleRepo: humpbackWhaleRepo,
		userRepo:          userRepo,
		imageRepo:         imageRepo,
	}
}
