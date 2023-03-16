package api

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/exp/slices"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const SentryDSN = "https://2b8b40065a7c480584a06774b22741d5@o1302719.ingest.sentry.io/6540750"

// API is the object containing API route handlers
type API struct {
	ExternalConfig      external.Config
	SkipStateTokenCheck bool
	Logger              zerolog.Logger
	OverrideTime        *time.Time
	DB                  *mongo.Database
	DBCleanup           func()
}

func GetAPIWithDBCleanup() (*API, func()) {
	dbh, err := database.CreateDBHandle()
	if err != nil {
		log.Fatal().Msgf("Failed to connect to db, %+v", err)
	}
	return &API{ExternalConfig: external.GetConfig(), SkipStateTokenCheck: false, Logger: *logging.GetSentryLogger(), DB: dbh.DB}, dbh.CloseConnection
}

func getTokenFromCookie(c *gin.Context, db *mongo.Database) (*database.InternalAPIToken, error) {
	authToken, err := c.Cookie("authToken")
	if err != nil {
		c.JSON(401, gin.H{"detail": "missing authToken cookie"})
		return nil, errors.New("invalid auth token")
	}
	internalAPITokenCollection := database.GetInternalTokenCollection(db)
	var internalToken database.InternalAPIToken
	err = internalAPITokenCollection.FindOne(context.Background(), bson.M{"token": authToken}).Decode(&internalToken)
	if err != nil {
		c.JSON(401, gin.H{"detail": "invalid auth token"})
		return nil, errors.New("invalid auth token")
	}
	return &internalToken, nil
}

// Ping godoc
// @Summary      Returns success
// @Description  used to determine if server online
// @Tags         utils
// @Success      200 {object} string
// @Router       /ping/ [get]
func (api *API) Ping(c *gin.Context) {
	log.Info().Msg("success!")
	c.JSON(200, "success")
}

// Middleware to get the user token from the request if it exists
func UserTokenMiddleware(db *mongo.Database) func(c *gin.Context) {
	return func(c *gin.Context) {
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
		internalAPITokenCollection := database.GetInternalTokenCollection(db)
		var internalToken database.InternalAPIToken
		err = internalAPITokenCollection.FindOne(context.Background(), bson.M{"token": token}).Decode(&internalToken)
		if err == nil {
			c.Set("user", internalToken.UserID)
		}
	}
}

func AuthorizationMiddleware(db *mongo.Database) func(c *gin.Context) {
	return func(c *gin.Context) {
		handlerName := c.HandlerName()
		if handlerName[len(handlerName)-9:] == "Handle404" {
			// Do nothing if the route isn't recognized
			return
		}
		if _, exists := c.Get("user"); !exists {
			_, err := getToken(c)
			if err != nil {
				// This means the auth token format was incorrect
				c.AbortWithStatusJSON(401, gin.H{"detail": "incorrect auth token format"})
				return
			}
			log.Error().Err(err).Msg("token auth failed")
			c.AbortWithStatusJSON(401, gin.H{"detail": "unauthorized"})
		}
	}
}

func LoggingMiddleware(db *mongo.Database) func(c *gin.Context) {
	return func(c *gin.Context) {
		if c.Request.URL.Path == "/log_events/" {
			// no need to record API calls to the log event endpoint
			return
		}
		eventType := "api_hit_" + c.Request.URL.Path
		userID, exists := c.Get("user")
		if !exists {
			userID = primitive.NilObjectID
		}
		err := database.InsertLogEvent(db, userID.(primitive.ObjectID), eventType)
		if err != nil {
			logger := logging.GetSentryLogger()
			logger.Error().Err(err).Msg("error inserting log event")
		}
	}
}

func getToken(c *gin.Context) (string, error) {
	token := c.Request.Header.Get("Authorization")
	//Token is 36 characters + 6 for Bearer prefix + 1 for space = 43
	if len(token) != 43 {
		return "", errors.New("incorrect auth token format")
	}
	token = token[7:]
	return token, nil
}

// CORSMiddleware sets CORS headers, abort if CORS preflight request is received
func CORSMiddleware(c *gin.Context) {
	allowedOrigins := strings.Split(config.GetConfigValue("ACCESS_CONTROL_ALLOW_ORIGINS"), ",")
	if origin := c.Request.Header.Get("Origin"); slices.Contains(allowedOrigins, origin) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
	} else {
		c.Writer.Header().Set("Access-Control-Allow-Origin", config.GetConfigValue("DEFAULT_ACCESS_CONTROL_ALLOW_ORIGIN"))
	}

	c.Writer.Header().Set("Access-Control-Allow-Headers", "Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Content-Type,Timezone-Offset,sentry-trace,baggage")
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
		time.Sleep(time.Second / 2)
	}
}

func isLocalServer() bool {
	return config.GetConfigValue("DB_NAME") == "main" && config.GetEnvironment() == config.Dev
}

func LogRequestMiddleware(db *mongo.Database) func(c *gin.Context) {
	return func(c *gin.Context) {
		startTime := time.Now()

		// runs the rest of the request
		c.Next()

		userID, exists := c.Get("user")
		if !exists {
			userID = primitive.NilObjectID
		}
		userObjectID := userID.(primitive.ObjectID)

		id := c.Param("task_id")
		if id == "" {
			id = c.Param("event_id")
		}
		var objectID primitive.ObjectID
		if id != "" {
			objectID, err := primitive.ObjectIDFromHex(id)
			if err != nil {
				// This means the task ID is improperly formatted
				log.Error().Err(err).Msgf("could not parse object_id=%s", objectID)
				return
			}
		}

		status := c.Writer.Status()
		database.LogRequestInfo(db, startTime, userObjectID, c.Request.URL.Path, time.Now().UnixMilli()-startTime.UnixMilli(), &objectID, status)
	}
}

func NotFoundRedirect(c *gin.Context, url string) {
	body := []byte(`
<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Refresh" content="0; url='` + url + `'" />
</head>
<body>
</body>
</html>`)
	c.Data(200, "text/html; charset=utf-8", body)
}
