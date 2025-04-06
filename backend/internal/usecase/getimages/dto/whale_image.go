package dto

import (
	"time"

	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

type HumpbackWhaleImage struct {
	ID          uuid.UUID `json:"id"`
	AuthorID    uuid.UUID `json:"author_id"`
	Username    string    `json:"username"`
	CreatedAt   time.Time `json:"created_at"`
	SawAt       time.Time `json:"saw_at"`
	Longitude   float64   `json:"longitude"`
	Latitude    float64   `json:"latitude"`
	Description string    `json:"description"`
	WhaleType   string    `json:"whale_type"`
	ImageURL    string    `json:"image_url"`
}

func NewHumpbackWhaleImage(
	images []*domain.HumpbackWhale,
	users []*domain.User,
	imgInfo []domain.ImageInfo,
) []HumpbackWhaleImage {
	userMap := make(map[uuid.UUID]string)
	for _, user := range users {
		userMap[user.ID] = user.Username
	}

	imageMap := make(map[uuid.UUID]string)
	for _, img := range imgInfo {
		imageMap[img.ObjectID] = img.URL
	}

	res := make([]HumpbackWhaleImage, 0, len(images))
	for _, img := range images {
		res = append(res, HumpbackWhaleImage{
			ID:          img.ID,
			AuthorID:    img.AuthorID,
			Username:    userMap[img.AuthorID],
			CreatedAt:   img.CreatedAt,
			Longitude:   img.Longitude,
			Latitude:    img.Latitude,
			Description: img.Description,
			WhaleType:   img.WhaleType,
			ImageURL:    imageMap[img.ObjectID],
			SawAt:       img.SawAt,
		})
	}

	return res
}
