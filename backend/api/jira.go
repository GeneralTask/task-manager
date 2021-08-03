package api

import (
	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// JIRARedirectParams ...
type JIRARedirectParams struct {
	Code  string `form:"code"`
	State string `form:"state"`
}

type PriorityID struct {
	ID string `json:"id"`
}

func (api *API) AuthorizeJIRA(c *gin.Context) {
	internalToken, err := getTokenFromCookie(c)
	if err != nil {
		return
	}
	atlassian := external.AtlassianService{Config: api.AtlassianConfigValues}
	authURL, err := atlassian.GetLinkAuthURL(internalToken.UserID)
	if err != nil {
		Handle500(c)
		return
	}
	c.Redirect(302, *authURL)
}

func (api *API) AuthorizeJIRACallback(c *gin.Context) {
	internalToken, err := getTokenFromCookie(c)
	if err != nil {
		return
	}
	// See https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/
	var redirectParams JIRARedirectParams
	if c.ShouldBind(&redirectParams) != nil || redirectParams.Code == "" || redirectParams.State == "" {
		c.JSON(400, gin.H{"detail": "Missing query params"})
		return
	}
	stateTokenID, err := primitive.ObjectIDFromHex(redirectParams.State)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid state token format"})
		return
	}
	atlassian := external.AtlassianService{Config: api.AtlassianConfigValues}
	err = atlassian.HandleAuthCallback(redirectParams.Code, stateTokenID, internalToken.UserID)
	if err != nil {
		c.JSON(500, gin.H{"detail": err.Error()})
		return
	}

	c.Writer.Write([]byte("<html><head><script>window.open('','_parent','');window.close();</script></head><body>Success</body></html>"))
	c.Status(200)
}
