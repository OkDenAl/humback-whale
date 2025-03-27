package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		accessToken := strings.Split(authHeader, " ")[1]
		if accessToken == "" {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}

		fmt.Println(accessToken)

		c.Next()
	}
}
