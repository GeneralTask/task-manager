package api

import (
	"context"
	"log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func (api *API) Logout(c *gin.Context) {
	parent_ctx := c.Request.Context()
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

	tokenCollection := db.Collection("internal_api_tokens")
	db_ctx, cancel := context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	result, err := tokenCollection.DeleteOne(db_ctx, bson.M{"token": token})
	if err != nil {
		log.Printf("failed to remove token: %v", err)
		Handle500(c)
		return
	}
	if result.DeletedCount == 0 {
		c.AbortWithStatusJSON(401, gin.H{"detail": "unauthorized"})
	} else {
		c.JSON(200, gin.H{})
	}
}
