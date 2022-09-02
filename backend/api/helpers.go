package api

import (
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
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

func (t TaskResult) GetID() string {
	return t.ID.Hex()
}

func (p PullRequestResult) GetID() string {
	return p.ID
}

type OrderingIDGetter interface {
	GetOrderingID() int
}

func (result OverviewResult[T]) GetOrderingID() int {
	return result.IDOrdering
}

func (api *API) GetCurrentLocalizedTime(timezoneOffset time.Duration) time.Time {
	localZone := time.FixedZone("", int(-1*timezoneOffset.Seconds()))
	return api.GetCurrentTime().In(localZone)
}

func (api *API) GetCurrentTime() time.Time {
	if api.OverrideTime != nil {
		return *api.OverrideTime
	}
	return time.Now()
}

func GetTimezoneOffsetFromHeader(c *gin.Context) (time.Duration, error) {
	headers := c.Request.Header
	timezoneOffsetHeader := headers["Timezone-Offset"]
	if len(timezoneOffsetHeader) == 0 {
		return time.Duration(0), errors.New("Timezone-Offset header is required")
	}
	duration, err := time.ParseDuration(timezoneOffsetHeader[0] + "m")
	if err != nil {
		return duration, errors.New("Timezone-Offset header is invalid")
	}
	return duration, nil
}

func getValidExternalOwnerAssignedTask(db *mongo.Database, userID primitive.ObjectID, taskTitle string) (*database.User, string, error) {
	fromToken, err := database.GetUser(db, userID)
	if err != nil {
		return nil, "", err
	}

	if strings.HasSuffix(fromToken.Email, "@generaltask.com") && strings.HasPrefix(taskTitle, "<to ") {
		regex, err := regexp.Compile(`<to [a-zA-Z]+>`)
		if err != nil {
			logger := logging.GetSentryLogger()
			logger.Error().Err(err).Msg("error compiling regex")
		}
		name := regex.FindString(taskTitle)
		name = strings.Trim(name, "<to ")
		name = strings.Trim(name, ">")
		matchingUser, err := database.GetGeneralTaskUserByName(db, name)
		if err != nil {
			return nil, "", err
		}

		taskTitle = regex.ReplaceAllString(taskTitle, "") + " from: " + fromToken.Email
		return matchingUser, taskTitle, nil
	}
	return nil, "", errors.New("unable to perform with non General Task users")
}
