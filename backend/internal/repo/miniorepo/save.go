package miniorepo

import (
	"bytes"
	"context"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

func (r *Repo) SaveImage(ctx context.Context, img []byte) (domain.ImageInfo, error) {
	objectID := uuid.New()
	reader := bytes.NewReader(img)
	contentType := http.DetectContentType(img)

	opts := minio.PutObjectOptions{
		ContentType: contentType,
	}

	if _, err := r.db.PutObject(ctx, r.bucketName, objectID.String(), reader, int64(len(img)), opts); err != nil {
		return domain.ImageInfo{}, errors.Wrap(err, "failed to save image")
	}

	// Получение URL для загруженного объекта
	url, err := r.db.PresignedGetObject(context.Background(), r.bucketName, objectID.String(), time.Hour, nil)
	if err != nil {
		return domain.ImageInfo{}, errors.Wrap(err, "failed to get presigned url")
	}

	return domain.ImageInfo{
		ObjectID: objectID,
		URL:      url.String(),
	}, nil
}
