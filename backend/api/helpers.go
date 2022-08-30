package api

import (
	"errors"
	"time"

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
