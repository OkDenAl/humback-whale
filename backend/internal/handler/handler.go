package handler

import (
	"context"

	"github.com/gin-gonic/gin"

	"github.com/OkDenAl/humback-whale/internal/usecase/uploadwhaleimg"
)

type iUploadWhaleImageUC interface {
	Handle(ctx context.Context, cmd uploadwhaleimg.Command) (string, error)
}

type Handler struct {
	uploadWhaleImageUC iUploadWhaleImageUC
}

func New(uploadWhaleImageUC iUploadWhaleImageUC) Handler {
	return Handler{
		uploadWhaleImageUC: uploadWhaleImageUC,
	}
}

func (h Handler) SetRouter(api *gin.RouterGroup) {
	api.POST("/upload/:author_id", h.uploadImg())
}
