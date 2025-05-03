package dbview

// this code is generated with `//go:generate sqlview -table=<tableName>`

// The name of the database table.
const HumpbackWhaleTableName = "humpback_whale"

// Vals() returns the list of values of a view struct.
// The order always matches the Fields() method and HumpbackWhaleFieldsType.All() method.
func (view HumpbackWhaleRecord) Vals() []any {
	return []any{
		view.ID,
		view.AuthorID,
		view.CreatedAt,
		view.SawAt,
		view.Longitude,
		view.Latitude,
		view.Description,
		view.WhaleTypeID,
		view.ObjectID,
		view.WhaleName,
		view.Gender,
	}
}

// Fields() returns the list of database field names mapped to a view structure.
// The order always remains the same.
func (view HumpbackWhaleRecord) Fields() []string {
	return HumpbackWhaleFields().All()
}

// HumpbackWhaleFieldsType struct contains database field names for the view structure.
// It enables calling database fields in SQL requests.
type HumpbackWhaleFieldsType struct {
	ID          string
	AuthorID    string
	CreatedAt   string
	SawAt       string
	Longitude   string
	Latitude    string
	Description string
	WhaleTypeID string
	ObjectID    string
	WhaleName   string
	Gender      string
}

var humpbackWhaleFields = HumpbackWhaleFieldsType{
	ID:          `"id"`,
	AuthorID:    `"author_id"`,
	CreatedAt:   `"created_at"`,
	SawAt:       `"saw_at"`,
	Longitude:   `"longitude"`,
	Latitude:    `"latitude"`,
	Description: `"description"`,
	WhaleTypeID: `"whale_type_id"`,
	ObjectID:    `"object_id"`,
	WhaleName:   `"whale_name"`,
	Gender:      `"gender"`,
}

// HumpbackWhaleFields() returns a propperly filled HumpbackWhaleFieldsType object.
func HumpbackWhaleFields() HumpbackWhaleFieldsType {
	return humpbackWhaleFields
}

// HumpbackWhaleFieldsType returns the list of database field names mapped to a view structure.
// The order always remains the same.
func (HumpbackWhaleFieldsType) All() []string {
	return []string{
		`"id"`,
		`"author_id"`,
		`"created_at"`,
		`"saw_at"`,
		`"longitude"`,
		`"latitude"`,
		`"description"`,
		`"whale_type_id"`,
		`"object_id"`,
		`"whale_name"`,
		`"gender"`,
	}
}
