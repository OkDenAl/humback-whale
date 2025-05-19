package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/OkDenAl/humback-whale/internal/usecase/updateimginfo"
	"github.com/OkDenAl/humback-whale/pkg/logger"
)

// @BasePath /api/v1
// updateImgInfo godoc
// @Summary update images info
// @Schemes
// @Description update images info
// @Tags Whale
// @Param limit body updateImageInfoReq true "Req body json"
// @Param Authorization header string true "authorization bearer token"
// @Produce json
// @Success 200
// @Failure 400 {object} httpError
// @Failure 404 {object} httpError
// @Failure 401 {object} httpError
// @Failure 500 {object} httpError
// @Router /private/whale/update [post]
func (h Handler) updateImgInfo() gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		imgID := c.Param("img_id")

		var req updateImageInfoReq
		if err := c.BindJSON(&req); err != nil {
			log.Error().Stack().Err(err).Msg("failed to parse update image info request")
			c.JSON(
				http.StatusBadRequest,
				newError(errors.Wrap(err, "failed to parse login request"), http.StatusBadRequest),
			)
			return
		}

		cmd, err := updateimginfo.NewCommand(
			imgID,
			req.Description,
			req.WhaleType,
			req.Name,
			req.Gender,
		)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to create command for update images info")
			c.JSON(
				http.StatusBadRequest,
				newError(errors.Wrap(err, "failed to create command for update images info"), http.StatusBadRequest),
			)
			return
		}

		if err = h.updateWhaleImageInfoUC.Handle(c, cmd); err != nil {
			log.Error().Stack().Err(err).Msg("failed to update images info")
			switch {
			case errors.Is(err, integrationerror.ErrHumpbackWhaleNotFound):
				c.JSON(
					http.StatusNotFound,
					newError(errors.Wrap(err, "failed to update images info"), http.StatusNotFound),
				)
			default:
				c.JSONP(
					http.StatusInternalServerError,
					newError(errors.Wrap(err, "failed to update images info"), http.StatusInternalServerError),
				)
			}

			return
		}

		c.JSON(http.StatusOK, gin.H{})
	}
}

type updateImageInfoReq struct {
	Description string `json:"description"`
	WhaleType   string `json:"whale_type"`
	Gender      string `json:"gender"`
	Name        string `json:"name"`
}
