package api

import (
	"context"

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
	token, err := getToken(c)
	if err != nil {
		c.AbortWithStatusJSON(401, gin.H{"detail": "incorrect auth token format"})
		return
	}

	tokenCollection := database.GetInternalTokenCollection(api.DB)
	result, err := tokenCollection.DeleteOne(context.Background(), bson.M{"token": token})
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
