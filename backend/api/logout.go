package api

import (
	"log"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func (api *API) Logout(c *gin.Context) {
	token, err := getToken(c)
	if err != nil {
		return
	}
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()

	tokenCollection := db.Collection("internal_api_tokens")
	result, err := tokenCollection.DeleteOne(nil, bson.M{"token": token})
	if err != nil {
		log.Fatal(err)
	}
	if result.DeletedCount == 0 {
		c.AbortWithStatusJSON(401, gin.H{"detail": "unauthorized"})
	} else {
		c.JSON(200, gin.H{})
	}
}
