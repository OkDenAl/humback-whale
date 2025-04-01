package miniorepo

import (
	"context"
	"io"
	"net/url"
	"time"

	"github.com/minio/minio-go/v7"
)

//go:generate minimock -g -s .go -i iMinioClient -o ../../../mocks/repo/miniorepo
type iMinioClient interface {
	RemoveObject(ctx context.Context, bucketName, objectName string, opts minio.RemoveObjectOptions) error
	PutObject(ctx context.Context, bucketName, objectName string, reader io.Reader, objectSize int64, opts minio.PutObjectOptions) (minio.UploadInfo, error)
	PresignedGetObject(ctx context.Context, bucketName string, objectName string, expires time.Duration, reqParams url.Values) (*url.URL, error)
}

type Repo struct {
	db         iMinioClient
	bucketName string
}

func New(db iMinioClient, bucketName string) *Repo {
	return &Repo{db: db, bucketName: bucketName}
}
