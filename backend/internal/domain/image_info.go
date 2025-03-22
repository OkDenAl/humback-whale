package domain

import "github.com/google/uuid"

type ImageInfo struct {
	ObjectID uuid.UUID
	URL      string
}
