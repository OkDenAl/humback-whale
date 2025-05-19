package domain

import "github.com/google/uuid"

type WhaleType struct {
	ID                 uuid.UUID `json:"id"`
	SpeciesEng         string    `json:"species_eng"`
	SpeciesRus         string    `json:"species_rus"`
	Family             string    `json:"family"`
	Genus              string    `json:"genus"`
	ConservationStatus string    `json:"conservation_status"`
}

func NewWhaleType(speciesEng, speciesRus, family, genus, consStatus string) *WhaleType {
	return &WhaleType{
		ID:                 uuid.New(),
		SpeciesEng:         speciesEng,
		SpeciesRus:         speciesRus,
		Family:             family,
		Genus:              genus,
		ConservationStatus: consStatus,
	}
}

func (w *WhaleType) Recreate(speciesEng, speciesRus, family, genus, consStatus string) {
	w.SpeciesEng = speciesEng
	w.SpeciesRus = speciesRus
	w.Family = family
	w.Genus = genus
	w.ConservationStatus = consStatus
}
