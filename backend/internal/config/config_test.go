package config

import (
	"testing"

	"github.com/go-playground/validator/v10"
	"github.com/ilyakaznacheev/cleanenv"
	"github.com/stretchr/testify/require"
)

func TestCfg_Validate(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name         string
		path         string
		setSecureCfg func(config *Config)
	}{
		{
			name: "config_local",
			path: "../../config/application.yaml",
			setSecureCfg: func(cfg *Config) {
				cfg.Postgres.ConnString = "test"
				cfg.MinioS3.RootUser = "test"
				cfg.MinioS3.RootPassword = "<PASSWORD>"
				cfg.JWTGenerator.SigningKey = "test"
			},
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			var cfg Config
			err := cleanenv.ReadConfig(tc.path, &cfg)
			require.NoError(t, err, "validation")

			tc.setSecureCfg(&cfg)

			if err = validator.New().Struct(cfg); err != nil {
				require.NoError(t, err, "validation")
			}
		})
	}
}
