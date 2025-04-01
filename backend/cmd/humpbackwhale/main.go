package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/ds248a/closer"

	_ "github.com/OkDenAl/humback-whale/docs"
	"github.com/OkDenAl/humback-whale/internal/repo/http/mlrecognizer"
	"github.com/OkDenAl/humback-whale/internal/repo/miniorepo"
	"github.com/OkDenAl/humback-whale/internal/repo/postgres"
	"github.com/OkDenAl/humback-whale/internal/service/jwtgenerator"
	"github.com/OkDenAl/humback-whale/internal/usecase/auth"
	"github.com/OkDenAl/humback-whale/internal/usecase/getimages"
	"github.com/OkDenAl/humback-whale/internal/usecase/login"
	"github.com/OkDenAl/humback-whale/internal/usecase/register"
	"github.com/OkDenAl/humback-whale/internal/usecase/uploadwhaleimg"
	"github.com/OkDenAl/humback-whale/pkg/logger"
	"github.com/OkDenAl/humback-whale/pkg/minioclient"
	"github.com/OkDenAl/humback-whale/pkg/postgresclient"
)

// @title           Humpback whale recognition service
// @version         1.0
// @description     Text markup - it is the service for getting markup from text.
// @contact.name   humback-whale
// @contact.url    https://github.com/OkDenAl/humback-whale
// @BasePath  /api/v1
// @Host localhost:80
func main() {
	cfg, err := setupConfig()
	if err != nil {
		log := logger.New()
		log.Panic().Stack().Err(err).Msg("failed to setup cfg")
	}
	ctx := context.Background()

	setupLogger(cfg)
	log := logger.New()

	// service
	jwtGeneratorService := jwtgenerator.New(cfg.JWTGenerator)

	// repo
	pgPool, err := postgresclient.NewPool(ctx, cfg.Postgres)
	if err != nil {
		log.Panic().Stack().Err(err).Msg("failed to create pg pool")
	}
	pgRepo := postgres.New(pgPool)

	minioClient, err := minioclient.NewMinioClient(ctx, cfg.MinioS3)
	if err != nil {
		log.Panic().Stack().Err(err).Msg("failed to create miniorepo client")
	}
	minioRepo := miniorepo.New(minioClient, cfg.MinioS3.BucketName)

	mlrecognizerRepo := mlrecognizer.New(cfg.MlRecognizerHTTP)

	// usecases
	uploadWhaleImgUC := uploadwhaleimg.NewUC(pgRepo, minioRepo, mlrecognizerRepo)
	getWhaleImgUC := getimages.NewUC(cfg.GetImagesUC, pgRepo, pgRepo, minioRepo)

	loginUC := login.NewUC(jwtGeneratorService, pgRepo)
	registerUC := register.NewUC(jwtGeneratorService, pgRepo)
	authUC := auth.NewUC(jwtGeneratorService)

	errCh := initAndStartHTTPServer(cfg.HTTP, uploadWhaleImgUC, getWhaleImgUC, loginUC, registerUC, authUC)
	printLocalURLS(cfg.HTTP.Port)

	gracefulShutdown(errCh)
}

func gracefulShutdown(errCh <-chan error) {
	log := logger.New()
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, os.Interrupt, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)
	select {
	case s := <-signals:
		closer.Close(s)
		log.Error().Stack().Msgf("os signal detected - %s", s.String())
	case err := <-errCh:
		closer.Close(syscall.SIGTERM)
		log.Error().Stack().Err(err).Msgf("http server error detected")
	}
}
