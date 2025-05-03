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
