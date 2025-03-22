package middleware

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/OkDenAl/humback-whale/pkg/logger"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		t := time.Now()
		c.Next()
		latency := time.Since(t).String()
		status := c.Writer.Status()

		if len(c.Errors) != 0 {
			for _, err := range c.Errors {
				log.Error().
					Stack().
					Err(err).
					Str("method:", c.Request.Method).
					Str("path", c.Request.URL.Path).
					Str("status", strconv.Itoa(status)).
					Msg("failed to processed request")
			}

			return
		}

		log.Info().
			Str("latency", latency).
			Str("method:", c.Request.Method).
			Str("path", c.Request.URL.Path).
			Str("status", strconv.Itoa(status)).
			Msg("request processed successfully")
	}
}
