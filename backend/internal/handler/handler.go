package handler

import (
	"context"

	"github.com/gin-gonic/gin"

	"github.com/OkDenAl/humback-whale/internal/usecase/deletewhaleimg"
	"github.com/OkDenAl/humback-whale/internal/usecase/deletewhaletype"
	"github.com/OkDenAl/humback-whale/internal/usecase/getimages"
	"github.com/OkDenAl/humback-whale/internal/usecase/getwhaletypes"
	"github.com/OkDenAl/humback-whale/internal/usecase/login"
	"github.com/OkDenAl/humback-whale/internal/usecase/register"
	"github.com/OkDenAl/humback-whale/internal/usecase/savewhaletype"
	"github.com/OkDenAl/humback-whale/internal/usecase/updateimginfo"
	"github.com/OkDenAl/humback-whale/internal/usecase/uploadwhaleimg"
)

type iUploadWhaleImageUC interface {
	Handle(ctx context.Context, cmd uploadwhaleimg.Command) (string, error)
}

type iUpdateWhaleImageInfoUC interface {
	Handle(ctx context.Context, cmd updateimginfo.Command) error
}

type iGetWhaleImageUC interface {
	Handle(ctx context.Context, q getimages.Query) (getimages.QueryResult, error)
}

type iLoginUC interface {
	Handle(ctx context.Context, q login.Query) (login.QueryResult, error)
}

type iRegisterUC interface {
	Handle(ctx context.Context, cmd register.Command) (register.Result, error)
}

type iGetWhaleTypesUC interface {
	Handle(ctx context.Context) ([]*getwhaletypes.WhaleType, error)
}

type iDeleteWhaleImageUC interface {
	Handle(ctx context.Context, cmd deletewhaleimg.Command) error
}

type iSaveWhaleTypesUC interface {
	Handle(ctx context.Context, cmd savewhaletype.Command) error
}

type iDeleteWhaleTypesUC interface {
	Handle(ctx context.Context, cmd deletewhaletype.Command) error
}

type Handler struct {
	uploadWhaleImageUC     iUploadWhaleImageUC
	getWhaleImageUC        iGetWhaleImageUC
	loginUC                iLoginUC
	registerUC             iRegisterUC
	updateWhaleImageInfoUC iUpdateWhaleImageInfoUC
	getWhaleTypesUC        iGetWhaleTypesUC
	deleteWhaleImageUC     iDeleteWhaleImageUC
	saveWhaleTypesUC       iSaveWhaleTypesUC
	deleteWhaleTypesUC     iDeleteWhaleTypesUC
}

func New(
	uploadWhaleImageUC iUploadWhaleImageUC,
	getWhaleImageUC iGetWhaleImageUC,
	loginUC iLoginUC,
	registerUC iRegisterUC,
	updateWhaleImageInfoUC iUpdateWhaleImageInfoUC,
	getWhaleTypesUC iGetWhaleTypesUC,
	deleteWhaleImageUC iDeleteWhaleImageUC,
	saveWhaleTypesUC iSaveWhaleTypesUC,
	deleteWhaleTypesUC iDeleteWhaleTypesUC,
) Handler {
	return Handler{
		uploadWhaleImageUC:     uploadWhaleImageUC,
		getWhaleImageUC:        getWhaleImageUC,
		loginUC:                loginUC,
		registerUC:             registerUC,
		updateWhaleImageInfoUC: updateWhaleImageInfoUC,
		getWhaleTypesUC:        getWhaleTypesUC,
		deleteWhaleImageUC:     deleteWhaleImageUC,
		saveWhaleTypesUC:       saveWhaleTypesUC,
		deleteWhaleTypesUC:     deleteWhaleTypesUC,
	}
}

func (h Handler) SetPrivateRouter(api *gin.RouterGroup) {
	api.POST("/whale/upload", h.uploadImg())

	// for scientists only
	api.PUT("/whale/update/:img_id", h.updateImgInfo())
	api.POST("/whale/types", h.createWhaleType())
	api.DELETE("/whale/:whale_id", h.deleteWhaleImage())
	api.DELETE("/whale/types/:whale_type_id", h.deleteWhaleType())
}

func (h Handler) SetPublicRouter(api *gin.RouterGroup) {
	api.POST("/auth/login", h.login())
	api.POST("/auth/register", h.register())

	api.GET("/whale/images", h.getImages())
	api.GET("/whale/types", h.getWhaleTypes())
}
