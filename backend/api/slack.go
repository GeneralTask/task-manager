package api

import (
	"context"
	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"log"
)

type SlackRedirectParams struct {
	Code string `form:"code" binding:"required"`
}


func GetSlackConfig() OauthConfigWrapper {
	return &OauthConfig{Config:  &oauth2.Config{
		ClientID:     config.GetConfigValue("SLACK_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("SLACK_OAUTH_CLIENT_SECRET"),
		RedirectURL:  "https://api.generaltask.io/authorize/slack/callback",
		Scopes:       []string{"channels:history", "im:read", "mpim:history", "im:history", "groups:history", "mpim:write", "im:write", "channels:write", "groups:write", "chat:write:user"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://slack.com/oauth/authorize",
			TokenURL: "https://slack.com/api/oauth.access",
		},
	}}
}

func (api *API) AuthorizeSlack(c *gin.Context) {
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	insertedStateToken := database.CreateStateToken(db, nil)
	authURL := api.SlackConfig.AuthCodeURL(insertedStateToken, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	log.Printf("Auth url :%s", authURL)
	c.Redirect(302, authURL)
}

func (api *API) AuthorizeSlackCallback(c *gin.Context) {
	var redirectParams SlackRedirectParams
	if c.ShouldBind(&redirectParams) != nil {
		c.JSON(400, gin.H{"detail": "Missing query params"})
		return
	}

	token, err := api.SlackConfig.Exchange(context.Background(), redirectParams.Code)

	if err != nil {
		log.Printf("Failed to fetch token from google: %v", err)
		Handle500(c)
		return
	}


}
