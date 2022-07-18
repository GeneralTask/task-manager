package api

import (
	"net/http"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
)

type createTestUserParams struct {
	Email string `json:"email" binding:"required"`
	Name  string `json:"name" binding:"required"`
}

// CreateTestUser godoc
// @Summary      Creates a test user for use in local testing
// @Description  Only works in the dev environment (will not work in prod)
// @Tags         test
// @Accept       json
// @Produce      json
// @Param        payload  	  body       createTestUserParams 	 true   "test user params"
// @Success      201 {object} string "auth token"
// @Failure      400 {object} string "invalid params"
// @Failure      401 {object} string "non-dev environment"
// @Router       /create_test_user/ [post]
func (api *API) CreateTestUser(c *gin.Context) {
	if config.GetEnvironment() != config.Dev {
		log.Error().Msg("CreateTestUser called in non-`dev` environment!")
		c.JSON(http.StatusUnauthorized, gin.H{"detail": "not found"})
		return
	}
	var params createTestUserParams
	err := c.BindJSON(&params)
	if err != nil {
		log.Error().Err(err).Send()
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}
	authToken := login(params.Email, params.Name)
	c.JSON(http.StatusCreated, bson.M{"token": authToken})
}
