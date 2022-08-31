package api

import (
	"regexp"
	"strings"

	"github.com/GeneralTask/task-manager/backend/database"
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

func getValidExternalOwnerAssignedTask(db *mongo.Database, userID primitive.ObjectID, taskTitle string) (*database.User, string) {
	fromToken, err := database.GetUser(db, userID)
	if err != nil {
		return nil, ""
	}

	if strings.HasSuffix(fromToken.Email, "@generaltask.com") && strings.HasPrefix(taskTitle, "<to ") {
		regex, err := regexp.Compile(`<to [a-zA-Z]+>`)
		name := regex.FindString(taskTitle)
		name = strings.Trim(name, "<to ")
		name = strings.Trim(name, ">")
		matchingUser, err := database.GetGeneralTaskUserByName(db, name)
		if err != nil {
			return nil, ""
		}

		taskTitle = regex.ReplaceAllString(taskTitle, "") + " from: " + fromToken.Email
		return matchingUser, taskTitle
	}
	return nil, ""
}
