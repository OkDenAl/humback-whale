package uploadwhaleimg

import (
	"context"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

type iHumpbackWhaleRepo interface {
	SaveWhale(ctx context.Context, humpbackWhale *domain.HumpbackWhale) error
}

type iImageStorageRepo interface {
	SaveImage(ctx context.Context, img []byte) (domain.ImageInfo, error)
	DeleteImage(ctx context.Context, objectID string) error
}

type iRecognizerRepo interface {
	RecognizeWhales(ctx context.Context, img []byte) error
}

// UC обработчик команд, удовлетворяющих интерфейсу Command.
type UC struct {
	humpbackWhaleRepo iHumpbackWhaleRepo
	imageStorageRepo  iImageStorageRepo
	recognizerRepo    iRecognizerRepo
}

// NewUC возвращает новый UC.
func NewUC(humpbackWhaleRepo iHumpbackWhaleRepo, imageStorageRepo iImageStorageRepo, recognizerRepo iRecognizerRepo) *UC {
	return &UC{
		humpbackWhaleRepo: humpbackWhaleRepo,
		imageStorageRepo:  imageStorageRepo,
		recognizerRepo:    recognizerRepo,
	}
}
