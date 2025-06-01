package mailsender

import (
	"context"
	"fmt"

	"github.com/pkg/errors"
	"gopkg.in/gomail.v2"
)

func (s *Service) SendPasswordResetEmail(ctx context.Context, to, token string) error {
	subject := "Запрос на смену пароля"
	body := fmt.Sprintf(`
		<h2>Запрос на смену пароля</h2>
		<p>Вы запросили сброс вашего пароля. Перейдите по ссылке ниже, чтобы продолжить:</p>
		<p><a href="http://localhost:80/reset-password?token=%s">Сбросить пароль</a></p>
		<p>Если вы не запрашивали это, пожалуйста, проигнорируйте это письмо.</p>
		<p>Срок действия этой ссылки истечет через 1 час.</p>
	`, token)

	return s.sendEmail(ctx, to, subject, body)
}

func (s *Service) sendEmail(ctx context.Context, to, subject, body string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", s.config.From)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	if err := s.dialer.DialAndSend(m); err != nil {
		return errors.Wrap(err, "failed to send email")
	}

	return nil
}
