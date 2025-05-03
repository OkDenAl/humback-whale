package getimages

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
	ImageURL    string    `json:"image_url"`
	Name        string    `json:"name"`
	Gender      string    `json:"gender"`
	WhaleType   WhaleType `json:"whale_type"`
}

type WhaleType struct {
	ID                 uuid.UUID `json:"id"`
	SpeciesEng         string    `json:"species_eng"`
	SpeciesRus         string    `json:"species_rus"`
	Family             string    `json:"family"`
	Genus              string    `json:"genus"`
	ConservationStatus string    `json:"conservation_status"`
}

func NewWhaleType(whaleType *domain.WhaleType) WhaleType {
	return WhaleType{
		ID:                 whaleType.ID,
		SpeciesEng:         whaleType.SpeciesEng,
		SpeciesRus:         whaleType.SpeciesRus,
		Family:             whaleType.Family,
		Genus:              whaleType.Genus,
		ConservationStatus: whaleType.ConservationStatus,
	}
}

func NewHumpbackWhaleImageDTO(
	images []*domain.HumpbackWhale,
	users []*domain.User,
	imgInfo []domain.ImageInfo,
	whaleTypes []*domain.WhaleType,
) []HumpbackWhaleImage {
	userMap := make(map[uuid.UUID]string)
	for _, user := range users {
		userMap[user.ID] = user.Username
	}

	imageMap := make(map[uuid.UUID]string)
	for _, img := range imgInfo {
		imageMap[img.ObjectID] = img.URL
	}

	whaleTypesMap := make(map[uuid.UUID]WhaleType)
	for _, whaleType := range whaleTypes {
		whaleTypesMap[whaleType.ID] = NewWhaleType(whaleType)
	}

	res := make([]HumpbackWhaleImage, 0, len(images))
	for _, img := range images {

		res = append(res, HumpbackWhaleImage{
			ID:          img.ID,
			AuthorID:    img.AuthorID,
			Username:    userMap[img.AuthorID],
			CreatedAt:   img.CreatedAt,
			SawAt:       img.SawAt,
			Longitude:   img.Longitude,
			Latitude:    img.Latitude,
			Description: img.Description,
			ImageURL:    imageMap[img.ObjectID],
			Name:        img.WhaleName,
			Gender:      img.Gender,
			WhaleType:   whaleTypesMap[img.WhaleTypeID],
		})
	}

	return res
}
