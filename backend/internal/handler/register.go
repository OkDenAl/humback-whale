package handler

import (
	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/OkDenAl/humback-whale/internal/usecase/register"
	"github.com/OkDenAl/humback-whale/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"net/http"
)

// @BasePath /api/v1/
// register godoc
// @Summary register user
// @Schemes
// @Description register user
// @Tags Auth
// @Accept application/json
// @Produce json
// @Param   text body reqRegister  true  "JSON"
// @Success 200 {object} respRegister
// @Failure 400 {object} httpError
// @Failure 401 {object} httpError
// @Failure 409 {object} httpError
// @Failure 500 {object} httpError
// @Router /public/auth/register [post]
func (h Handler) register() gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		var req reqRegister
		if err := c.BindJSON(&req); err != nil {
			log.Error().Stack().Err(err).Msg("failed to parse register request")
			c.JSON(
				http.StatusBadRequest,
				newError(errors.Wrap(err, "failed to parse register request"), http.StatusBadRequest),
			)
			return
		}

		cmd, err := register.NewCommand(
			req.Email, req.Password, req.Username, req.Role,
			req.Degree, req.Rank, req.PlaceOfWork,
		)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to validate register request")
			c.JSON(
				http.StatusBadRequest,
				newError(errors.Wrap(err, "failed to validate register request"), http.StatusBadRequest),
			)
			return
		}

		res, err := h.registerUC.Handle(c, cmd)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to register")
			switch {
			case errors.Is(err, integrationerror.ErrUserAlreadyExists):
				c.JSON(
					http.StatusConflict,
					newError(errors.Wrap(err, "failed to register"), http.StatusConflict),
				)
			default:
				c.JSON(
					http.StatusInternalServerError,
					newError(errors.Wrap(err, "failed to register"), http.StatusInternalServerError),
				)
			}

			return
		}

		c.JSON(http.StatusOK, respRegister{
			Token:       res.Token,
			Username:    res.Username,
			IsScientist: res.IsScientist,
		})
	}
}

type reqRegister struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	Username    string `json:"username"`
	Role        string `json:"role"`
	Degree      string `json:"degree,omitempty"`
	Rank        string `json:"rank,omitempty"`
	PlaceOfWork string `json:"place_of_work,omitempty"`
}

type respRegister struct {
	Token       string `json:"token"`
	IsScientist bool   `json:"is_scientist"`
	Username    string `json:"username"`
}
