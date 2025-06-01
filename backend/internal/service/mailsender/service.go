package mailsender

import (
	"gopkg.in/gomail.v2"
)

type Service struct {
	config Config
	dialer *gomail.Dialer
}

func New(config Config) *Service {
	dialer := gomail.NewDialer(config.Host, config.Port, config.Username, config.Password)

	return &Service{
		config: config,
		dialer: dialer,
	}
}
