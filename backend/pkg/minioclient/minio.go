package minioclient

import (
	"context"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/pkg/errors"
)

type Config struct {
	Endpoint     string `yaml:"endpoint" validate:"required"`
	BucketName   string `yaml:"bucket_name" validate:"required"`
	RootUser     string `yaml:"root_user" env:"MINIO_ROOT_USER" validate:"required"`
	RootPassword string `yaml:"root_password" env:"MINIO_ROOT_PASSWORD" validate:"required"`
	UseSSL       bool   `yaml:"use_ssl"`
}

func NewMinioClient(ctx context.Context, cfg Config) (*minio.Client, error) {
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.RootUser, cfg.RootPassword, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, errors.Wrap(err, "failed to create miniorepo client")
	}

	exists, err := client.BucketExists(ctx, cfg.BucketName)
	if err != nil {
		return nil, errors.Wrap(err, "failed to check if bucket exists")
	}

	if !exists {
		if err = client.MakeBucket(ctx, cfg.BucketName, minio.MakeBucketOptions{Region: "us-east-1"}); err != nil {
			return nil, errors.Wrap(err, "failed to create bucket")
		}
	}

	return client, nil
}
