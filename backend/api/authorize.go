package api

import (
	"github.com/GeneralTask/task-manager/backend/database"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// RedirectParams ...
type RedirectParams struct {
	Code  string `form:"code" binding:"required"`
	State string `form:"state" binding:"required"`
}

func (api *API) Authorize(c *gin.Context) {
	taskService, err := api.ExternalConfig.GetTaskServiceResult(c.Param("service_name"))
	if err != nil {
		Handle404(c)
		return
	}
	internalToken, err := getTokenFromCookie(c)
	if err != nil {
		return
	}
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	insertedStateToken, err := database.CreateStateToken(db, &internalToken.UserID)
	if err != nil {
		Handle500(c)
		return
	}
	stateTokenID, err := primitive.ObjectIDFromHex(*insertedStateToken)
	if err != nil {
		Handle500(c)
		return
	}
	authURL, err := taskService.Service.GetLinkURL(stateTokenID, internalToken.UserID)
	if err != nil {
		Handle500(c)
		return
	}
	c.Redirect(302, *authURL)
}

func (api *API) AuthorizeCallback(c *gin.Context) {
	taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(c.Param("service_name"))
	if err != nil {
		Handle404(c)
		return
	}
	internalToken, err := getTokenFromCookie(c)
	if err != nil {
		return
	}
	var redirectParams RedirectParams
	if c.ShouldBind(&redirectParams) != nil || redirectParams.Code == "" || redirectParams.State == "" {
		c.JSON(400, gin.H{"detail": "Missing query params"})
		return
	}
	stateTokenID, err := primitive.ObjectIDFromHex(redirectParams.State)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid state token format"})
		return
	}
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	err = database.DeleteStateToken(db, stateTokenID, &internalToken.UserID)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid state token"})
		return
	}
	err = taskServiceResult.Service.HandleLinkCallback(redirectParams.Code, internalToken.UserID)
	if err != nil {
		c.JSON(500, gin.H{"detail": err.Error()})
		return
	}

	c.Writer.Write([]byte("<html><head><script>window.open('','_parent','');window.close();</script></head><body>Success</body></html>"))
	c.Status(200)
}
