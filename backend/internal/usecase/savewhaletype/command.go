package savewhaletype

import (
	"github.com/google/uuid"
	"github.com/pkg/errors"
)

type Command struct {
	ID                 uuid.UUID
	SpeciesEng         string
	SpeciesRus         string
	Family             string
	Genus              string
	ConservationStatus string
}

func NewCommand(id, speciesEng, speciesRus, family, genus, consStatus string) (Command, error) {
	var idUUID uuid.UUID
	var err error
	if id != "" {
		idUUID, err = uuid.Parse(id)
		if err != nil {
			return Command{}, errors.Wrap(err, "failed to parse whale type id")
		}
	}

	if speciesEng == "" {
		return Command{}, errors.Errorf("species eng is required")
	}

	if speciesRus == "" {
		return Command{}, errors.Errorf("species rus is required")
	}

	if family == "" {
		return Command{}, errors.Errorf("family is required")
	}

	if genus == "" {
		return Command{}, errors.Errorf("genus is required")
	}

	if consStatus == "" {
		return Command{}, errors.Errorf("conservation status is required")
	}

	return Command{
		ID:                 idUUID,
		SpeciesEng:         speciesEng,
		SpeciesRus:         speciesRus,
		Family:             family,
		Genus:              genus,
		ConservationStatus: consStatus,
	}, nil
}
