package dbview

import (
	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/google/uuid"
)

//go:generate sqlview -table=whale_type
type WhaleTypeRecord struct {
	ID                 uuid.UUID `db:"id"`
	SpeciesEng         string    `db:"species_eng"`
	SpeciesRus         string    `db:"species_rus"`
	Family             string    `db:"family"`
	Genus              string    `db:"genus"`
	ConservationStatus string    `db:"conservation_status"`
}

func WhaleTypeRecordFromDomain(whaleType *domain.WhaleType) WhaleTypeRecord {
	return WhaleTypeRecord{
		ID:                 whaleType.ID,
		SpeciesEng:         whaleType.SpeciesEng,
		SpeciesRus:         whaleType.SpeciesRus,
		Family:             whaleType.Family,
		Genus:              whaleType.Genus,
		ConservationStatus: whaleType.ConservationStatus,
	}
}

func WhaleTypeRecordToDomain(whaleType WhaleTypeRecord) *domain.WhaleType {
	return &domain.WhaleType{
		ID:                 whaleType.ID,
		SpeciesEng:         whaleType.SpeciesEng,
		SpeciesRus:         whaleType.SpeciesRus,
		Family:             whaleType.Family,
		Genus:              whaleType.Genus,
		ConservationStatus: whaleType.ConservationStatus,
	}
}

func WhaleTypeRecordsToDomain(whaleTypes []WhaleTypeRecord) []*domain.WhaleType {
	var result []*domain.WhaleType
	for _, whaleType := range whaleTypes {
		result = append(result, WhaleTypeRecordToDomain(whaleType))
	}

	return result
}
