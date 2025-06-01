package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/OkDenAl/humback-whale/internal/usecase/resetpassword"
	"github.com/OkDenAl/humback-whale/pkg/logger"
)

// @BasePath /api/v1/
// resetPassword godoc
// @Summary reset password
// @Schemes
// @Description reset password using token
// @Tags Auth
// @Accept application/json
// @Produce json
// @Param   text body resetPasswordRequest  true  "JSON"
// @Success 200 {object} resetPasswordResp
// @Failure 400 {object} httpError
// @Failure 500 {object} httpError
// @Router /public/auth/reset-password [post]
func (h Handler) resetPassword() gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		var req resetPasswordRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			log.Error().Stack().Err(err).Msg("failed to parse reset password request")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		cmd, err := resetpassword.NewCommand(req.Token, req.Password)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to create reset password command")
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := h.resetPasswordUC.Handle(c.Request.Context(), cmd); err != nil {
			log.Error().Stack().Err(err).Msg("failed to reset password")
			switch {
			case errors.Is(err, integrationerror.ErrInvalidToken):
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired token"})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reset password"})
			}
			return
		}

		log.Info().Msg("password reset successfully")
		c.JSON(http.StatusOK, gin.H{"message": "Password has been reset successfully"})
	}
}

type resetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type resetPasswordResp struct {
	Message string `json:"message"`
}
