package miniorepo

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/pkg/errors"
	"golang.org/x/sync/errgroup"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

func (r *Repo) GetOne(ctx context.Context, objectID uuid.UUID) (string, error) {
	url, err := r.db.PresignedGetObject(ctx, r.bucketName, objectID.String(), time.Second*24*60*60, nil)
	if err != nil {
		return "", errors.Wrap(err, "failed to get presigned url")
	}

	return url.String(), nil
}

func (r *Repo) GetMany(ctx context.Context, objectIDs []uuid.UUID) ([]domain.ImageInfo, error) {
	urlCh := make(chan domain.ImageInfo, len(objectIDs))

	var eg errgroup.Group

	// Запуск горутин для получения URL-адресов каждого объекта.
	for _, objectID := range objectIDs {
		objectID := objectID
		var url string
		eg.Go(func() (err error) {
			url, err = r.GetOne(ctx, objectID)
			urlCh <- domain.ImageInfo{
				ObjectID: objectID,
				URL:      url,
			}
			return err
		})
	}

	if err := eg.Wait(); err != nil {
		close(urlCh)
		return nil, errors.Wrap(err, "failed to get many url")
	}

	close(urlCh)

	var urls []domain.ImageInfo
	for url := range urlCh {
		urls = append(urls, url)
	}

	return urls, nil
}
