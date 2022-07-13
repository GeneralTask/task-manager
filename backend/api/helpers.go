package api

import (
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func getUserIDFromContext(c *gin.Context) primitive.ObjectID {
	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)
	return userID
}

func getViewIDFromContext(c *gin.Context) (primitive.ObjectID, error) {
	viewID := c.Param("view_id")
	return primitive.ObjectIDFromHex(viewID)
}
