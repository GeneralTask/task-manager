package api

import (
	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
)

type createTestUserParams struct {
	Email string `json:"email" binding:"required"`
	Name  string `json:"name" binding:"required"`
}

func (api *API) CreateTestUser(c *gin.Context) {
	if config.GetEnvironment() != config.Dev {
		log.Error().Msg("CreateTestUser called in non-`dev` environment!")
		c.JSON(404, gin.H{"detail": "not found"})
		return
	}
	var params createTestUserParams
	err := c.BindJSON(&params)
	if err != nil {
		log.Error().Err(err).Send()
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}
	// TODO: only allow if running in dev
	authToken := login(params.Email, params.Name)
	c.JSON(201, bson.M{"token": authToken})
}
