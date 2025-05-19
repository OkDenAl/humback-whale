package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/ds248a/closer"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"github.com/OkDenAl/humback-whale/docs"
	"github.com/OkDenAl/humback-whale/internal/config"
	"github.com/OkDenAl/humback-whale/internal/handler"
	"github.com/OkDenAl/humback-whale/internal/handler/middleware"
	"github.com/OkDenAl/humback-whale/internal/usecase/auth"
	"github.com/OkDenAl/humback-whale/internal/usecase/deletewhaleimg"
	"github.com/OkDenAl/humback-whale/internal/usecase/deletewhaletype"
	"github.com/OkDenAl/humback-whale/internal/usecase/getimages"
	"github.com/OkDenAl/humback-whale/internal/usecase/getwhaletypes"
	"github.com/OkDenAl/humback-whale/internal/usecase/login"
	"github.com/OkDenAl/humback-whale/internal/usecase/register"
	"github.com/OkDenAl/humback-whale/internal/usecase/savewhaletype"
	"github.com/OkDenAl/humback-whale/internal/usecase/updateimginfo"
	"github.com/OkDenAl/humback-whale/internal/usecase/uploadwhaleimg"
	"github.com/OkDenAl/humback-whale/pkg/logger"
)

func setupConfig() (*config.Config, error) {
	const (
		configPathEnv     = "CONFIG_PATH"
		defaultConfigPath = "./config/application.yaml"
	)

	configPath := os.Getenv(configPathEnv)
	if configPath == "" {
		configPath = defaultConfigPath
	}

	return config.New(configPath)
}

func setupLogger(cfg *config.Config) {
	logger.SetupLogLevel(cfg.LogLevel)
	logger.SetupWriter()
}

func initAndStartHTTPServer(
	cfg config.ServerConfig,
	uploadWhaleImgUC *uploadwhaleimg.UC,
	getWhaleImgUC *getimages.UC,
	loginUC *login.UC,
	registerUC *register.UC,
	authUC *auth.UC,
	updateWhaleImageInfoUC *updateimginfo.UC,
	getWhaleTypesUC *getwhaletypes.UC,
	deleteWhaleImageUC *deletewhaleimg.UC,
	saveWhaleTypesUC *savewhaletype.UC,
	deleteWhaleTypesUC *deletewhaletype.UC,
) <-chan error {
	gin.SetMode(gin.ReleaseMode)
	engine := gin.New()
	if cfg.SwaggerEnabled != nil && *cfg.SwaggerEnabled {
		engine.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
		docs.SwaggerInfo.Host = fmt.Sprintf("%s:%s", cfg.Host, cfg.Port)
	}

	h := handler.New(
		uploadWhaleImgUC,
		getWhaleImgUC,
		loginUC,
		registerUC,
		updateWhaleImageInfoUC,
		getWhaleTypesUC,
		deleteWhaleImageUC,
		saveWhaleTypesUC,
		deleteWhaleTypesUC,
	)

	publicApi := engine.Group("api/v1/public")
	publicApi.Use(
		gin.Recovery(),
		middleware.Logger(),
	)
	h.SetPublicRouter(publicApi)

	privateApi := engine.Group("api/v1/private")
	privateApi.Use(
		gin.Recovery(),
		middleware.Logger(),
		middleware.Auth(authUC),
	)
	h.SetPrivateRouter(privateApi)

	s := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      engine,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
	}

	closer.Add(func() {
		if err := s.Close(); err != nil {
			log := logger.New()
			log.Error().Stack().Err(err).Msg("failed to stop http server")
		}
	})

	errCh := make(chan error)
	go func() {
		if err := s.ListenAndServe(); err != nil {
			errCh <- errors.WithStack(err)
			close(errCh)
		}
	}()

	return errCh
}

func printLocalURLS(port string) {
	log := logger.New()

	log.Debug().Msgf("HTTP: http://localhost:%s", port)
	log.Debug().Msgf("SWAGGER: http://localhost:%s/swagger/index.html", port)
}
