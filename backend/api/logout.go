package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// Logout godoc
// @Summary      Logs a user out of General Task
// @Description  Removes the internal token associated with the session
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        Authorization     header     string  true  "General Task auth token"
// @Success      200 {object} string "success"
// @Failure      401 {object} string "unauthorized"
// @Failure      500 {object} string "internal server error"
// @Router       /logout/ [post]
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
		api.Logger.Error().Err(err).Msg("Failed to remove token")
		Handle500(c)
		return
	}
	if result.DeletedCount == 0 {
		c.AbortWithStatusJSON(401, gin.H{"detail": "unauthorized"})
	} else {
		c.JSON(200, gin.H{})
	}
}
