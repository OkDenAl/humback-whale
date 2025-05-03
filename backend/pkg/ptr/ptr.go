package ptr

// NilIfZero returns `nil` if the variable is the zero value of the given type,
// or returns a pointer to the variable.
func NilIfZero[T comparable](v T) *T {
	var zero T
	if v == zero {
		return nil
	}

	return &v
}

// Deref returns the zero value of the given type if the variable is `nil`,
// or dereferences the variable if it is not `nil`.
func Deref[T any](v *T) T {
	if v == nil {
		var res T
		return res
	}

	return *v
}

// Ref returns a reference to a copy of the argument x
func Ref[T any](x T) *T {
	return &x
}

// FromStringOrNil returns a pointer to the string if it's not empty, otherwise returns nil.
func FromStringOrNil(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
