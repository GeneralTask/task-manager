package api

import (
	"context"
	"errors"
	"log"
	"net/http"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// API is the object containing API route handlers
type API struct {
	ExternalConfig      external.Config
	SkipStateTokenCheck bool
}

func GetAPI() *API {
	return &API{ExternalConfig: external.GetConfig(), SkipStateTokenCheck: false}
}

func getTokenFromCookie(c *gin.Context) (*database.InternalAPIToken, error) {
	parent_ctx := c.Request.Context()
	authToken, err := c.Cookie("authToken")
	if err != nil {
		c.JSON(401, gin.H{"detail": "missing authToken cookie"})
		return nil, errors.New("invalid auth token")
	}
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return nil, err
	}
	defer dbCleanup()
	internalAPITokenCollection := db.Collection("internal_api_tokens")
	var internalToken database.InternalAPIToken
	db_ctx, cancel := context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	err = internalAPITokenCollection.FindOne(db_ctx, bson.M{"token": authToken}).Decode(&internalToken)
	if err != nil {
		c.JSON(401, gin.H{"detail": "invalid auth token"})
		return nil, errors.New("invalid auth token")
	}
	return &internalToken, nil
}

func (api *API) Ping(c *gin.Context) {
	log.Println("success!")
	c.JSON(200, "success")
}

func TokenMiddleware(c *gin.Context) {
	parent_ctx := c.Request.Context()
	handlerName := c.HandlerName()
	if handlerName[len(handlerName)-9:] == "Handle404" {
		// Do nothing if the route isn't recognized
		return
	}
	token, err := getToken(c)
	if err != nil {
		// This means the auth token format was incorrect
		return
	}
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		c.AbortWithStatusJSON(500, gin.H{"detail": "internal server error"})
		return
	}
	defer dbCleanup()
	internalAPITokenCollection := db.Collection("internal_api_tokens")
	var internalToken database.InternalAPIToken
	db_ctx, cancel := context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	err = internalAPITokenCollection.FindOne(db_ctx, bson.M{"token": token}).Decode(&internalToken)
	if err != nil {
		log.Printf("auth failed: %v\n", err)
		c.AbortWithStatusJSON(401, gin.H{"detail": "unauthorized"})
		return
	}
	c.Set("user", internalToken.UserID)
}

func getToken(c *gin.Context) (string, error) {
	token := c.Request.Header.Get("Authorization")
	//Token is 36 characters + 6 for Bearer prefix + 1 for space = 43
	if len(token) != 43 {
		c.AbortWithStatusJSON(401, gin.H{"detail": "incorrect auth token format"})
		return "", errors.New("incorrect auth token format")
	}
	token = token[7:]
	return token, nil
}

// CORSMiddleware sets CORS headers, abort if CORS preflight request is received
func CORSMiddleware(c *gin.Context) {
	c.Writer.Header().Set("Access-Control-Allow-Headers", "Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset")
	c.Writer.Header().Set("Access-Control-Allow-Origin", config.GetConfigValue("ACCESS_CONTROL_ALLOW_ORIGIN"))
	c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")
	if c.Request.Method == "OPTIONS" {
		c.AbortWithStatus(http.StatusNoContent)
	}
	c.Next()
}

func Handle404(c *gin.Context) {
	c.JSON(404, gin.H{"detail": "not found"})
}

func Handle500(c *gin.Context) {
	c.JSON(500, gin.H{"detail": "internal server error"})
}
