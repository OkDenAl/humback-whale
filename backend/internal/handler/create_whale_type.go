package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/usecase/savewhaletype"
	"github.com/OkDenAl/humback-whale/pkg/logger"
)

// @BasePath /api/v1
// createWhaleType godoc
// @Summary create whale type or update existing whale type
// @Schemes
// @Tags Whale
// @Param Authorization header string true "Insert your access token" default(Bearer <token>)
// @Produce json
// @Success 200
// @Failure 400 {object} httpError
// @Failure 401 {object} httpError
// @Failure 500 {object} httpError
// @Router /public/whale/types [post]
func (h Handler) createWhaleType() gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		var req createWhaleTypeReq
		if err := c.BindJSON(&req); err != nil {
			log.Error().Stack().Err(err).Msg("failed to parse create whale type request")
			c.JSON(
				http.StatusBadRequest,
				newError(errors.Wrap(err, "failed to parse create whale type request"), http.StatusBadRequest),
			)
			return
		}

		cmd, err := savewhaletype.NewCommand(
			req.ID,
			req.SpeciesEng,
			req.SpeciesRus,
			req.Family,
			req.Genus,
			req.ConservationStatus,
		)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to validate create whale type request")
			c.JSON(
				http.StatusBadRequest,
				newError(errors.Wrap(err, "failed to validate create whale type request"), http.StatusBadRequest),
			)
			return
		}

		if err = h.saveWhaleTypesUC.Handle(c.Request.Context(), cmd); err != nil {
			log.Error().Stack().Err(err).Msg("failed to create whale type")
			c.JSON(
				http.StatusInternalServerError,
				newError(errors.Wrap(err, "failed to get whale types"), http.StatusInternalServerError),
			)
			return
		}

		c.Status(http.StatusOK)
	}
}

type createWhaleTypeReq struct {
	ID                 string `json:"id"`
	SpeciesEng         string `json:"species_eng"`
	SpeciesRus         string `json:"species_rus"`
	Family             string `json:"family"`
	Genus              string `json:"genus"`
	ConservationStatus string `json:"conservation_status"`
}
