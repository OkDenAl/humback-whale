package miniorepo

import (
	"github.com/minio/minio-go/v7"
)

type Repo struct {
	db         *minio.Client
	bucketName string
}

func New(db *minio.Client, bucketName string) *Repo {
	return &Repo{db: db, bucketName: bucketName}
}
