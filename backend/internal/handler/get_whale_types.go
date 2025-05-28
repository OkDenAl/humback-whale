package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/usecase/getwhaletypes"
	"github.com/OkDenAl/humback-whale/pkg/logger"
)

// @BasePath /api/v1
// getWhaleTypes godoc
// @Summary get all whale types
// @Schemes
// @Description Get a list of all available whale types
// @Tags Whale Types
// @Produce json
// @Success 200 {object} getWhaleTypesResp
// @Failure 500 {object} httpError
// @Router /public/whale/types [get]
func (h Handler) getWhaleTypes() gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		whaleTypes, err := h.getWhaleTypesUC.Handle(c.Request.Context())
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to get whale types")
			c.JSON(
				http.StatusInternalServerError,
				newError(errors.Wrap(err, "failed to get whale types"), http.StatusInternalServerError),
			)
			return
		}

		c.JSON(http.StatusOK, getWhaleTypesResp{
			WhaleTypes: whaleTypes,
		})
	}
}

// getWhaleTypesResp defines the structure for the response.
type getWhaleTypesResp struct {
	WhaleTypes []*getwhaletypes.WhaleType `json:"whale_types"`
}
