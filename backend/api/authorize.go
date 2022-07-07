package api

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Oauth1RedirectParams struct {
	Token    string `form:"oauth_token" binding:"required"`
	Verifier string `form:"oauth_verifier" binding:"required"`
}

type Oauth2RedirectParams struct {
	Code  string `form:"code" binding:"required"`
	State string `form:"state" binding:"required"`
}

// Link godoc
// @Summary      Redirects to link callback for that service
// @Description  First step in oauth verification
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        sourceID   path      string  true  "Source ID"
// @Success      302 {object} string "URL redirect"
// @Failure      404 {object} string "service not found"
// @Success      500 {object} string "internal server error"
// @Router       /link/{sourceID}/ [get]
func (api *API) Link(c *gin.Context) {
	taskService, err := api.ExternalConfig.GetTaskServiceResult(c.Param("service_name"))
	if err != nil {
		Handle404(c)
		return
	}
	internalToken, err := getTokenFromCookie(c)
	if err != nil {
		return
	}
	stateTokenID := primitive.NilObjectID
	if taskService.Details.AuthType == external.AuthTypeOauth2 {
		db, dbCleanup, err := database.GetDBConnection()
		if err != nil {
			Handle500(c)
			return
		}
		defer dbCleanup()
		insertedStateToken, err := database.CreateStateToken(db, &internalToken.UserID, false)
		if err != nil {
			Handle500(c)
			return
		}
		stateTokenID, err = primitive.ObjectIDFromHex(*insertedStateToken)
		if err != nil {
			Handle500(c)
			return
		}
	}
	authURL, err := taskService.Service.GetLinkURL(stateTokenID, internalToken.UserID)
	if err != nil {
		Handle500(c)
		return
	}
	c.Redirect(302, *authURL)
}

func (api *API) LinkCallback(c *gin.Context) {
	taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(c.Param("service_name"))
	if err != nil {
		Handle404(c)
		return
	}
	internalToken, err := getTokenFromCookie(c)
	if err != nil {
		return
	}
	callbackParams := external.CallbackParams{}
	if taskServiceResult.Details.AuthType == external.AuthTypeOauth1 {
		var redirectParams Oauth1RedirectParams
		if c.ShouldBind(&redirectParams) != nil || redirectParams.Token == "" || redirectParams.Verifier == "" {
			c.JSON(400, gin.H{"detail": "missing query params"})
			return
		}
		callbackParams = external.CallbackParams{Oauth1Token: &redirectParams.Token, Oauth1Verifier: &redirectParams.Verifier}
	} else if taskServiceResult.Details.AuthType == external.AuthTypeOauth2 {
		var redirectParams Oauth2RedirectParams
		if c.ShouldBind(&redirectParams) != nil || redirectParams.Code == "" || redirectParams.State == "" {
			c.JSON(400, gin.H{"detail": "missing query params"})
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
		callbackParams = external.CallbackParams{Oauth2Code: &redirectParams.Code}
	}
	err = taskServiceResult.Service.HandleLinkCallback(callbackParams, internalToken.UserID)
	if err != nil {
		c.JSON(500, gin.H{"detail": err.Error()})
		return
	}

	c.Writer.Write([]byte("<html><head><script>window.open('','_parent','');window.close();</script></head><body>Success</body></html>"))
	c.Status(200)
}
