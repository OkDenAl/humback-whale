package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/OkDenAl/humback-whale/internal/usecase/sendresetpassword"
	"github.com/OkDenAl/humback-whale/pkg/logger"
)

// @BasePath /api/v1/
// sendResetPassword godoc
// @Summary Отправка письма со сбросом пароля
// @Schemes
// @Tags Аутентификация
// @Accept application/json
// @Produce json
// @Param   text body sendResetPasswordRequest  true  "JSON"
// @Success 200 {object} sendResetPasswordResp
// @Failure 400 {object} httpError
// @Failure 500 {object} httpError
// @Router /public/auth/send-reset-password [post]
func (h Handler) sendResetPassword() gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		var req sendResetPasswordRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			log.Error().Stack().Err(err).Msg("failed to parse send reset password request")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		cmd, err := sendresetpassword.NewCommand(req.Email)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to create send reset password command")
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := h.sendResetPasswordUC.Handle(c.Request.Context(), cmd); err != nil {
			log.Error().Stack().Err(err).Msg("failed to send reset password email")
			switch {
			case errors.Is(err, integrationerror.ErrUserNotFound):
				c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send reset password email"})
			}
			return
		}

		log.Info().Msg("reset password email sent successfully")
		c.JSON(http.StatusOK, gin.H{"message": "Reset password email has been sent successfully"})
	}
}

type sendResetPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type sendResetPasswordResp struct {
	Message string `json:"message"`
}
