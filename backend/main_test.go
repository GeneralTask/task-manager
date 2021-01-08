package main

import (
	"testing"

	"github.com/gin-gonic/gin"
)

func TestLoginRedirect(t *testing.T) {
	// https://semaphoreci.com/community/tutorials/test-driven-development-of-go-web-applications-with-gin
	r := gin.Default()
	r.GET("/login/", login)
}
