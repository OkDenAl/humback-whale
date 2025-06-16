package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/usecase/deletewhaleimg"
	"github.com/OkDenAl/humback-whale/pkg/logger"
)

// @BasePath /api/v1
// deleteWhaleImage godoc
// @Summary Удаляет наблюдение кита
// @Schemes
// @Tags Наблюдение кита
// @Param Authorization header string true "Insert your access token" default(Bearer <token>)
// @Param whale_id path string true "Whale Image ID (UUID)"
// @Produce json
// @Success 204 "No Content"
// @Failure 400 {object} httpError "Invalid Whale ID format"
// @Failure 401 {object} httpError "Unauthorized"
// @Failure 404 {object} httpError "Whale image not found"
// @Failure 500 {object} httpError "Internal Server Error"
// @Router /private/whale/{whale_id} [delete]
func (h Handler) deleteWhaleImage() gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		whaleIDStr := c.Param("whale_id")
		cmd, err := deletewhaleimg.NewCommand(whaleIDStr)
		if err != nil {
			log.Warn().Err(err).Stack().Msg("failed to create delete whale image command")
			c.JSON(http.StatusBadRequest, newError(errors.Wrap(err, "failed to create delete whale image command"), http.StatusBadRequest))
			return
		}

		if err = h.deleteWhaleImageUC.Handle(c.Request.Context(), cmd); err != nil {
			log.Error().Stack().Err(err).Str("whale_id", whaleIDStr).Msg("failed to delete whale image")
			switch {
			default:
				c.JSON(http.StatusInternalServerError, newError(errors.Wrap(err, "failed to delete whale image"), http.StatusInternalServerError))
			}
			return
		}

		c.Status(http.StatusNoContent)
	}
}
