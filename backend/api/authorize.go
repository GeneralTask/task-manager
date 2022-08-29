package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/logging"

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
// @Param        service_name   path      string  true  "Source ID"
// @Success      302 {object} string "URL redirect"
// @Failure      404 {object} string "service not found"
// @Failure      500 {object} string "internal server error"
// @Router       /link/{service_name}/ [get]
func (api *API) Link(c *gin.Context) {
	taskService, err := api.ExternalConfig.GetTaskServiceResult(c.Param("service_name"))
	if err != nil {
		Handle404(c)
		return
	}
	internalToken, err := getTokenFromCookie(c, api.DB)
	if err != nil {
		return
	}
	stateTokenID := primitive.NilObjectID
	if taskService.Details.AuthType == external.AuthTypeOauth2 {
		insertedStateToken, err := database.CreateStateToken(api.DB, &internalToken.UserID, false)
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

// LinkCallback godoc
// @Summary      Exchanges Oauth tokens using state and code
// @Description  Callback for initial /link/ call
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        service_name   path      string  true  "Source ID"
// @Param        code   	query     string  true  "OAuth Code"
// @Param        state  	query     string  false "OAuth State"
// @Success      200 {object} string "success"
// @Failure      400 {object} string "invalid params"
// @Failure      404 {object} string "service not found"
// @Failure      500 {object} string "internal server error"
// @Router       /link/{service_name}/callback/ [get]
func (api *API) LinkCallback(c *gin.Context) {
	taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(c.Param("service_name"))
	if err != nil {
		Handle404(c)
		return
	}
	internalToken, err := getTokenFromCookie(c, api.DB)
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

// LinkSlackApp godoc
// @Summary      Links a Slack workspace to be able to use General Task
// @Description  Used because we treat this access_token differently to the others
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        code   	query     string  true  "OAuth Code"
// @Param        state  	query     string  false "OAuth State"
// @Success      302 {object} string "URL Redirect"
// @Failure      404 {object} string "service not found"
// @Failure      500 {object} string "internal server error"
// @Router       /link_app/slack/ [get]
func (api *API) LinkSlackApp(c *gin.Context) {
	logger := logging.GetSentryLogger()
	parentCtx := context.Background()
	taskService, err := api.ExternalConfig.GetTaskServiceResult("slack_app")
	if err != nil {
		Handle404(c)
		return
	}

	var redirectParams Oauth2RedirectParams
	_ = c.ShouldBind(&redirectParams)
	// don't need to check for errors on the bind because state will not be included (which will throw error)
	if redirectParams.Code == "" {
		logger.Error().Msg("invalid oauth params")
		c.JSON(500, gin.H{"detail": "invalid oauth params"})
		return
	}

	slackService := taskService.Service.(external.SlackService)
	_, err = slackService.Config.OauthConfig.Exchange(parentCtx, redirectParams.Code)
	if err != nil {
		logger.Error().Err(err).Msg("unable to exchange Slack app oauth keys")
		c.JSON(500, gin.H{"detail": err.Error()})
		return
	}

	c.Redirect(302, config.GetConfigValue("HOME_URL"))
}
