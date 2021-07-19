package api

import (
	"context"
	"encoding/json"
	"log"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

type SlackRedirectParams struct {
	Code  string `form:"code" binding:"required"`
	State string `form:"state" binding:"required"`
}

func GetSlackConfig() *OauthConfig {
	return &OauthConfig{Config: &oauth2.Config{
		ClientID:     config.GetConfigValue("SLACK_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("SLACK_OAUTH_CLIENT_SECRET"),
		RedirectURL:  "https://api.generaltask.io/authorize/slack/callback",
		Scopes:       []string{"channels:history", "channels:read", "im:read", "mpim:history", "im:history", "groups:history", "groups:read", "mpim:write", "im:write", "channels:write", "groups:write", "chat:write:user"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://slack.com/oauth/authorize",
			TokenURL: "https://slack.com/api/oauth.access",
		},
	}}
}

func (api *API) AuthorizeSlack(c *gin.Context) {
	internalToken, err := getTokenFromCookie(c)

	if err != nil {
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		log.Printf("failed to get db: %v", err)
		Handle500(c)
		return
	}
	defer dbCleanup()

	insertedStateToken, err := database.CreateStateToken(db, &internalToken.UserID)
	if err != nil || insertedStateToken == nil {
		log.Printf("failed to save state token: %v", err)
		Handle500(c)
		return
	}

	authURL := api.SlackConfig.AuthCodeURL(*insertedStateToken, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	c.Redirect(302, authURL)
}

func (api *API) AuthorizeSlackCallback(c *gin.Context) {
	internalToken, err := getTokenFromCookie(c)

	if err != nil {
		return
	}

	var redirectParams SlackRedirectParams
	if c.ShouldBind(&redirectParams) != nil {
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
		c.JSON(500, gin.H{"detail": "invalid state token"})
		return
	}

	token, err := api.SlackConfig.Exchange(context.Background(), redirectParams.Code)

	if err != nil {
		log.Printf("failed to fetch token from Slack: %v", err)
		Handle500(c)
		return
	}

	tokenString, err := json.Marshal(&token)

	if err != nil {
		log.Printf("error parsing token: %v", err)
		Handle500(c)
		return
	}

	externalAPITokenCollection := db.Collection("external_api_tokens")
	_, err = externalAPITokenCollection.UpdateOne(
		context.TODO(),
		bson.M{"$and": []bson.M{{"user_id": internalToken.UserID}, {"source": database.TaskSourceSlack.Name}}},
		bson.M{"$set": &database.ExternalAPIToken{
			UserID: internalToken.UserID,
			Source: database.TaskSourceSlack.Name,
			Token:  string(tokenString)}},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		log.Printf("error saving token: %v", err)
		Handle500(c)
		return
	}

	c.Redirect(302, config.GetConfigValue("HOME_URL"))
}
