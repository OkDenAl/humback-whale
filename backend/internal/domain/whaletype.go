package domain

import "github.com/google/uuid"

type WhaleType struct {
	ID                 uuid.UUID
	SpeciesEng         string
	SpeciesRus         string
	Family             string
	Genus              string
	ConservationStatus string
}
