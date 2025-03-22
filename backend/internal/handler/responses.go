package handler

type httpError struct {
	Code  int    `json:"code"`
	Error string `json:"error"`
}

func newError(err error, code int) httpError {
	return httpError{Error: err.Error(), Code: code}
}
