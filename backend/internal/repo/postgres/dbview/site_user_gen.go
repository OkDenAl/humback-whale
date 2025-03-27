package dbview

// this code is generated with `//go:generate sqlview -table=<tableName>`

// The name of the database table.
const SiteUserTableName = "site_user"

// Vals() returns the list of values of a view struct.
// The order always matches the Fields() method and SiteUserFieldsType.All() method.
func (view UserRecord) Vals() []any {
	return []any{
		view.ID,
		view.Email,
		view.Username,
		view.Password,
		view.Role,
	}
}

// Fields() returns the list of database field names mapped to a view structure.
// The order always remains the same.
func (view UserRecord) Fields() []string {
	return SiteUserFields().All()
}

// SiteUserFieldsType struct contains database field names for the view structure.
// It enables calling database fields in SQL requests.
type SiteUserFieldsType struct {
	ID       string
	Email    string
	Nickname string
	Password string
	Role     string
}

var siteUserFields = SiteUserFieldsType{
	ID:       `"id"`,
	Email:    `"email"`,
	Nickname: `"username"`,
	Password: `"password"`,
	Role:     `"user_role"`,
}

// SiteUserFields() returns a propperly filled SiteUserFieldsType object.
func SiteUserFields() SiteUserFieldsType {
	return siteUserFields
}

// SiteUserFieldsType returns the list of database field names mapped to a view structure.
// The order always remains the same.
func (SiteUserFieldsType) All() []string {
	return []string{
		`"id"`,
		`"email"`,
		`"username"`,
		`"password"`,
		`"user_role"`,
	}
}
