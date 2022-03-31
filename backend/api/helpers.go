package api

import (
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func getUserObjectIDFromContext(c *gin.Context) primitive.ObjectID {
	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)
	return userID
}
