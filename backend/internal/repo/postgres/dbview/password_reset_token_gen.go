package dbview

// this code is generated with `//go:generate sqlview -table=<tableName>`

// The name of the database table.
const PasswordResetTokenTableName = "password_reset_token"

// Vals() returns the list of values of a view struct.
// The order always matches the Fields() method and PasswordResetTokenFieldsType.All() method.
func (view PasswordResetTokenRecord) Vals() []any {
	return []any{
		view.Token,
		view.UserID,
		view.Email,
		view.CreatedAt,
		view.ExpiresAt,
		view.Used,
	}
}

// Fields() returns the list of database field names mapped to a view structure.
// The order always remains the same.
func (view PasswordResetTokenRecord) Fields() []string {
	return PasswordResetTokenFields().All()
}

// PasswordResetTokenFieldsType struct contains database field names for the view structure.
// It enables calling database fields in SQL requests.
type PasswordResetTokenFieldsType struct {
	Token     string
	UserID    string
	Email     string
	CreatedAt string
	ExpiresAt string
	Used      string
}

var passwordResetTokenFields = PasswordResetTokenFieldsType{
	Token:     `"token"`,
	UserID:    `"user_id"`,
	Email:     `"email"`,
	CreatedAt: `"created_at"`,
	ExpiresAt: `"expires_at"`,
	Used:      `"used"`,
}

// PasswordResetTokenFields() returns a propperly filled PasswordResetTokenFieldsType object.
func PasswordResetTokenFields() PasswordResetTokenFieldsType {
	return passwordResetTokenFields
}

// PasswordResetTokenFieldsType returns the list of database field names mapped to a view structure.
// The order always remains the same.
func (PasswordResetTokenFieldsType) All() []string {
	return []string{
		`"token"`,
		`"user_id"`,
		`"email"`,
		`"created_at"`,
		`"expires_at"`,
		`"used"`,
	}
}
