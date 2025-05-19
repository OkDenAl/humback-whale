package getwhaletypes

import (
	"github.com/google/uuid"

	"github.com/OkDenAl/humback-whale/internal/domain"
)

type WhaleType struct {
	ID                 uuid.UUID `json:"id"`
	SpeciesEng         string    `json:"species_eng"`
	SpeciesRus         string    `json:"species_rus"`
	Family             string    `json:"family"`
	Genus              string    `json:"genus"`
	ConservationStatus string    `json:"conservation_status"`
}

func NewWhaleType(whaleType *domain.WhaleType) *WhaleType {
	return &WhaleType{
		ID:                 whaleType.ID,
		SpeciesEng:         whaleType.SpeciesEng,
		SpeciesRus:         whaleType.SpeciesRus,
		Family:             whaleType.Family,
		Genus:              whaleType.Genus,
		ConservationStatus: whaleType.ConservationStatus,
	}
}

func NewWhaleTypesDTO(whaleTypes []*domain.WhaleType) []*WhaleType {
	res := make([]*WhaleType, 0, len(whaleTypes))
	for _, whaleType := range whaleTypes {
		res = append(res, NewWhaleType(whaleType))
	}

	return res
}
