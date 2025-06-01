package uploadwhaleimg

import (
	"context"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

type iHumpbackWhaleRepo interface {
	SaveWhale(ctx context.Context, humpbackWhale *domain.HumpbackWhale) error
}

type iImageRepo interface {
	SaveImage(ctx context.Context, img []byte) (domain.ImageInfo, error)
	DeleteImage(ctx context.Context, objectID string) error
}

type iRecognizerRepo interface {
	RecognizeWhale(ctx context.Context, url string) error
}

type UC struct {
	humpbackWhaleRepo iHumpbackWhaleRepo
	imageStorageRepo  iImageRepo
	recognizerRepo    iRecognizerRepo
}

func NewUC(humpbackWhaleRepo iHumpbackWhaleRepo, imageStorageRepo iImageRepo, recognizerRepo iRecognizerRepo) *UC {
	return &UC{
		humpbackWhaleRepo: humpbackWhaleRepo,
		imageStorageRepo:  imageStorageRepo,
		recognizerRepo:    recognizerRepo,
	}
}
