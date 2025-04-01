package handler

import (
	"context"

	"github.com/gin-gonic/gin"

	"github.com/OkDenAl/humback-whale/internal/usecase/getimages"
	"github.com/OkDenAl/humback-whale/internal/usecase/login"
	"github.com/OkDenAl/humback-whale/internal/usecase/register"
	"github.com/OkDenAl/humback-whale/internal/usecase/uploadwhaleimg"
)

type iUploadWhaleImageUC interface {
	Handle(ctx context.Context, cmd uploadwhaleimg.Command) (string, error)
}

type iGetWhaleImageUC interface {
	Handle(ctx context.Context, q getimages.Query) (getimages.QueryResult, error)
}

type iLoginUC interface {
	Handle(ctx context.Context, q login.Query) (login.QueryResult, error)
}

type iRegisterUC interface {
	Handle(ctx context.Context, cmd register.Command) (string, error)
}

type Handler struct {
	uploadWhaleImageUC iUploadWhaleImageUC
	getWhaleImageUC    iGetWhaleImageUC
	loginUC            iLoginUC
	registerUC         iRegisterUC
}

func New(
	uploadWhaleImageUC iUploadWhaleImageUC,
	getWhaleImageUC iGetWhaleImageUC,
	loginUC iLoginUC,
	registerUC iRegisterUC,
) Handler {
	return Handler{
		uploadWhaleImageUC: uploadWhaleImageUC,
		getWhaleImageUC:    getWhaleImageUC,
		loginUC:            loginUC,
		registerUC:         registerUC,
	}
}

func (h Handler) SetPrivateRouter(api *gin.RouterGroup) {
	api.POST("/whale/upload", h.uploadImg())
	api.GET("/whale/images", h.getImages())
}

func (h Handler) SetPublicRouter(api *gin.RouterGroup) {
	api.POST("/auth/login", h.login())
	api.POST("/auth/register", h.register())
}
