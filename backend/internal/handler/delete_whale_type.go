package handler

import (
	"github.com/OkDenAl/humback-whale/internal/usecase/deletewhaletype"
	"github.com/OkDenAl/humback-whale/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"net/http"
)

// @BasePath /api/v1
// deleteWhaleType godoc
// @Summary Удаляет вид кита
// @Schemes
// @Description Deletes a whale type record.
// @Tags Вид кита
// @Param Authorization header string true "Insert your access token" default(Bearer <token>)
// @Param whale_type_id path string true "Whale Type ID (UUID)"
// @Produce json
// @Success 204 "No Content"
// @Failure 400 {object} httpError "Invalid Whale Type ID format"
// @Failure 401 {object} httpError "Unauthorized"
// @Failure 500 {object} httpError "Internal Server Error"
// @Router /private/whale/types/{whale_type_id} [delete]
func (h Handler) deleteWhaleType() gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		whaleTypeIDStr := c.Param("whale_type_id")
		cmd, err := deletewhaletype.NewCommand(whaleTypeIDStr)
		if err != nil {
			log.Warn().Err(err).Stack().Msg("failed to create delete whale type command")
			c.JSON(http.StatusBadRequest, newError(errors.Wrap(err, "failed to create delete whale type command"), http.StatusBadRequest))
			return
		}

		if err = h.deleteWhaleTypesUC.Handle(c.Request.Context(), cmd); err != nil {
			log.Error().Stack().Err(err).Msg("failed to delete whale types")
			c.JSON(
				http.StatusInternalServerError,
				newError(errors.Wrap(err, "failed to delete whale types"), http.StatusInternalServerError),
			)
			return
		}

		c.Status(http.StatusOK)
	}
}
