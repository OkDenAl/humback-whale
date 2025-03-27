package main

import (
	"golang.org/x/crypto/bcrypt"
)

func main() {
	if err := bcrypt.CompareHashAndPassword([]byte("$2a$04$icFNoDps8lFqlkQZ.UMC7.t6Z/mUCno1yGgwXLSBt.pGAxkiooLsy"), []byte("kek")); err != nil {
		panic(err)
	}
}
