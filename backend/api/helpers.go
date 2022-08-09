package api

import (
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
