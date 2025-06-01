package mailsender

type Config struct {
	Host     string `yaml:"host" validate:"required"`
	Port     int    `yaml:"port" validate:"required"`
	Username string `yaml:"username" env:"USERNAME" validate:"required"`
	Password string `yaml:"password" env:"PASSWORD" validate:"required"`
	From     string `yaml:"from" validate:"required"`
}
