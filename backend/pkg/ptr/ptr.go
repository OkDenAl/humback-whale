package ptr

func NilIfZero[T comparable](v T) *T {
	var zero T
	if v == zero {
		return nil
	}

	return &v
}

func Deref[T any](v *T) T {
	if v == nil {
		var res T
		return res
	}

	return *v
}

func Ref[T any](x T) *T {
	return &x
}

func FromStringOrNil(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
