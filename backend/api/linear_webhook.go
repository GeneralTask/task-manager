package api

import (
	"bytes"
	"io/ioutil"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func (api *API) LinearWebhook(c *gin.Context) {
	// make request body readable
	body, _ := ioutil.ReadAll(c.Request.Body)
	// this is required, as the first write fully consumes the body
	// the Form in the body is required for payload extraction
	c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(body))

	log.Print(string(body))

	c.JSON(501, gin.H{"detail": "method not recognized"})
}
