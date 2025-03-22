package miniorepo

import (
	"context"

	"github.com/minio/minio-go/v7"
	"github.com/pkg/errors"
)

func (r *Repo) DeleteImage(ctx context.Context, objectID string) error {
	err := r.db.RemoveObject(ctx, r.bucketName, objectID, minio.RemoveObjectOptions{})
	if err != nil {
		return errors.Wrap(err, "failed to delete image")
	}
	return nil
}
