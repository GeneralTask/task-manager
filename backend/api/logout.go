package api

import (
	"context"
	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func (api *API) Logout(c *gin.Context) {
	parentCtx := c.Request.Context()
	token, err := getToken(c)
	if err != nil {
		return
	}
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	tokenCollection := database.GetInternalTokenCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	result, err := tokenCollection.DeleteOne(dbCtx, bson.M{"token": token})
	if err != nil {
		log.Error().Err(err).Msg("Failed to remove token")
		Handle500(c)
		return
	}
	if result.DeletedCount == 0 {
		c.AbortWithStatusJSON(401, gin.H{"detail": "unauthorized"})
	} else {
		c.JSON(200, gin.H{})
	}
}
