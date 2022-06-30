package api

import (
	"context"
	"errors"
	"io"
	"net/http"
	"os"
	"time"

	zlogsentry "github.com/archdx/zerolog-sentry"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// API is the object containing API route handlers
type API struct {
	ExternalConfig      external.Config
	SkipStateTokenCheck bool
	Logger              zerolog.Logger
}

func GetAPI() *API {
	return &API{ExternalConfig: external.GetConfig(), SkipStateTokenCheck: false, Logger: GetSentryLogger()}
}

func GetSentryLogger() zerolog.Logger {
	w, err := zlogsentry.New("https://2b8b40065a7c480584a06774b22741d5@o1302719.ingest.sentry.io/6540750", zlogsentry.WithLevels(zerolog.WarnLevel))
	if err != nil {
		log.Err(err).Msg("failed to initialize sentry logger")
	}

	defer w.Close()

	return zerolog.New(io.MultiWriter(w, os.Stdout)).With().Timestamp().Logger()
}

func getTokenFromCookie(c *gin.Context) (*database.InternalAPIToken, error) {
	parentCtx := c.Request.Context()
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
	internalAPITokenCollection := database.GetInternalTokenCollection(db)
	var internalToken database.InternalAPIToken
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = internalAPITokenCollection.FindOne(dbCtx, bson.M{"token": authToken}).Decode(&internalToken)
	if err != nil {
		c.JSON(401, gin.H{"detail": "invalid auth token"})
		return nil, errors.New("invalid auth token")
	}
	return &internalToken, nil
}

func (api *API) Ping(c *gin.Context) {
	log.Info().Msg("success!")
	c.JSON(200, "success")
}

func TokenMiddleware(c *gin.Context) {
	parentCtx := c.Request.Context()
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
	internalAPITokenCollection := database.GetInternalTokenCollection(db)
	var internalToken database.InternalAPIToken
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = internalAPITokenCollection.FindOne(dbCtx, bson.M{"token": token}).Decode(&internalToken)
	if err != nil {
		log.Error().Err(err).Msg("token auth failed")
		c.AbortWithStatusJSON(401, gin.H{"detail": "unauthorized"})
		return
	}
	c.Set("user", internalToken.UserID)
}

func LoggingMiddleware(c *gin.Context) {
	if c.Request.URL.Path == "/log_events/" {
		// no need to record API calls to the log event endpoint
		return
	}
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		c.AbortWithStatusJSON(500, gin.H{"detail": "internal server error"})
		return
	}
	defer dbCleanup()
	eventType := "api_hit_" + c.Request.URL.Path
	userID, exists := c.Get("user")
	if !exists {
		userID = primitive.NilObjectID
	}
	database.InsertLogEvent(db, userID.(primitive.ObjectID), eventType)
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
	c.Writer.Header().Set("Access-Control-Allow-Headers", "Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Content-Type,Timezone-Offset")
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

func FakeLagMiddleware(c *gin.Context) {
	if isLocalServer() {
		time.Sleep(2 * time.Second)
	}
}

func isLocalServer() bool {
	return config.GetConfigValue("DB_NAME") == "main" && config.GetEnvironment() == config.Dev
}
