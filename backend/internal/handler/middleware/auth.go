package middleware

import (
	"context"
	"net/http"
	"slices"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/OkDenAl/humback-whale/internal/usecase/auth"
	"github.com/OkDenAl/humback-whale/pkg/logger"
)

const XAuthIDHeaderName = "X-Auth-ID"

type iAuthUC interface {
	Handle(ctx context.Context, q auth.Query) (auth.QueryResult, error)
}

func Auth(uc iAuthUC) gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			log.Warn().Msg("authorization header is empty")
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}

		splitted := strings.Split(authHeader, " ")
		if len(splitted) != 2 || !slices.Contains(splitted, "Bearer") && splitted[1] == "" {
			log.Warn().Msg("access token is empty")
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}

		accessToken := splitted[1]
		query, err := auth.NewQuery(accessToken)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to create query")
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}

		res, err := uc.Handle(c, query)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to handle query")
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}

		if !res.IsScientist && slices.Contains(availableRoutesOnlyForScientists, c.Request.URL.Path) {
			log.Warn().Msg("user is not scientist")
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}

		c.Request.Header.Add(XAuthIDHeaderName, res.AuthorID)

		c.Next()
	}
}

var availableRoutesOnlyForScientists = []string{
	"/api/v1/scientists",
}
