package dbview

// this code is generated with `//go:generate sqlview -table=<tableName>`

// The name of the database table.
const WhaleTypeTableName = "whale_type"

// Vals() returns the list of values of a view struct.
// The order always matches the Fields() method and WhaleTypeFieldsType.All() method.
func (view WhaleTypeRecord) Vals() []any {
	return []any{
		view.ID,
		view.SpeciesEng,
		view.SpeciesRus,
		view.Family,
		view.Genus,
		view.ConservationStatus,
	}
}

// Fields() returns the list of database field names mapped to a view structure.
// The order always remains the same.
func (view WhaleTypeRecord) Fields() []string {
	return WhaleTypeFields().All()
}

// WhaleTypeFieldsType struct contains database field names for the view structure.
// It enables calling database fields in SQL requests.
type WhaleTypeFieldsType struct {
	ID                 string
	SpeciesEng         string
	SpeciesRus         string
	Family             string
	Genus              string
	ConservationStatus string
}

var whaleTypeFields = WhaleTypeFieldsType{
	ID:                 `"id"`,
	SpeciesEng:         `"species_eng"`,
	SpeciesRus:         `"species_rus"`,
	Family:             `"family"`,
	Genus:              `"genus"`,
	ConservationStatus: `"conservation_status"`,
}

// WhaleTypeFields() returns a propperly filled WhaleTypeFieldsType object.
func WhaleTypeFields() WhaleTypeFieldsType {
	return whaleTypeFields
}

// WhaleTypeFieldsType returns the list of database field names mapped to a view structure.
// The order always remains the same.
func (WhaleTypeFieldsType) All() []string {
	return []string{
		`"id"`,
		`"species_eng"`,
		`"species_rus"`,
		`"family"`,
		`"genus"`,
		`"conservation_status"`,
	}
}
