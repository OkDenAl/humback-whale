package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/OkDenAl/humback-whale/internal/usecase/login"
	"github.com/OkDenAl/humback-whale/pkg/logger"
)

// @BasePath /api/v1/
// login godoc
// @Summary login user
// @Schemes
// @Description login user
// @Tags Auth
// @Accept application/json
// @Produce json
// @Param   text body reqLogin  true  "JSON"
// @Success 200 {object} respLogin
// @Success 400 {object} httpError
// @Success 404 {object} httpError
// @Failure 401 {object} httpError
// @Failure 500 {object} httpError
// @Router /public/auth/login [post]
func (h Handler) login() gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		var req reqLogin
		if err := c.BindJSON(&req); err != nil {
			log.Error().Stack().Err(err).Msg("failed to parse login request")
			c.JSON(
				http.StatusBadRequest,
				newError(errors.Wrap(err, "failed to parse login request"), http.StatusBadRequest),
			)
			return
		}

		q, err := login.NewQuery(req.Email, req.Password)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to validate login request")
			c.JSON(
				http.StatusBadRequest,
				newError(errors.Wrap(err, "failed to validate login request"), http.StatusBadRequest),
			)
			return
		}

		res, err := h.loginUC.Handle(c, q)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to login")
			switch {
			case errors.Is(err, integrationerror.ErrUserNotFound):
				c.JSON(
					http.StatusNotFound,
					newError(errors.Wrap(err, "failed to login"), http.StatusNotFound),
				)
			default:
				c.JSON(
					http.StatusInternalServerError,
					newError(errors.Wrap(err, "failed to login"), http.StatusInternalServerError),
				)
			}

			return
		}

		c.JSON(http.StatusOK, respLogin{
			Token:       res.Token,
			IsScientist: res.IsScientist,
			Username:    res.Username,
		})
	}
}

type reqLogin struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type respLogin struct {
	Token       string `json:"token"`
	IsScientist bool   `json:"is_scientist"`
	Username    string `json:"username"`
}
