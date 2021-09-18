package api

import (
	"context"
	"log"
	"strings"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	guuid "github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GoogleRedirectParams ...
type GoogleRedirectParams struct {
	State string `form:"state"`
	Code  string `form:"code"`
	Scope string `form:"scope"`
}

type LoginRedirectParams struct {
	ForcePrompt bool `form:"force_prompt"`
}

func (api *API) Login(c *gin.Context) {
	var params LoginRedirectParams
	forcePrompt := c.ShouldBind(&params) == nil && params.ForcePrompt
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	insertedStateToken, err := database.CreateStateToken(db, nil)
	if err != nil {
		Handle500(c)
		return
	}
	stateTokenID, err := primitive.ObjectIDFromHex(*insertedStateToken)
	if err != nil {
		Handle500(c)
		return
	}
	googleService := external.GoogleService{
		Config:       api.ExternalConfig.Google,
		OverrideURLs: api.ExternalConfig.GoogleOverrideURLs,
	}
	authURL, err := googleService.GetSignupURL(stateTokenID, forcePrompt)
	if err != nil {
		Handle500(c)
		return
	}
	c.SetCookie("loginStateToken", *insertedStateToken, 60*60*24, "/", config.GetConfigValue("COOKIE_DOMAIN"), false, false)
	c.Redirect(302, *authURL)
}

func (api *API) LoginCallback(c *gin.Context) {
	parent_ctx := c.Request.Context()
	var redirectParams GoogleRedirectParams
	if c.ShouldBind(&redirectParams) != nil || redirectParams.State == "" || redirectParams.Code == "" || redirectParams.Scope == "" {
		c.JSON(400, gin.H{"detail": "Missing query params"})
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	if !api.SkipStateTokenCheck {
		stateTokenID, err := primitive.ObjectIDFromHex(redirectParams.State)
		if err != nil {
			c.JSON(400, gin.H{"detail": "invalid state token format"})
			return
		}
		stateTokenFromCookie, _ := c.Cookie("loginStateToken")
		stateTokenIDFromCookie, err := primitive.ObjectIDFromHex(stateTokenFromCookie)
		if err != nil {
			c.JSON(400, gin.H{"detail": "invalid state token cookie format"})
			return
		}
		if stateTokenID != stateTokenIDFromCookie {
			c.JSON(400, gin.H{"detail": "State token does not match cookie"})
			return
		}
		err = database.DeleteStateToken(db, stateTokenID, nil)
		if err != nil {
			c.JSON(400, gin.H{"detail": "invalid state token"})
			return
		}
	}

	googleService := external.GoogleService{
		Config:       api.ExternalConfig.Google,
		OverrideURLs: api.ExternalConfig.GoogleOverrideURLs,
	}
	userID, email, err := googleService.HandleSignupCallback(redirectParams.Code)
	if err != nil {
		log.Printf("Failed to handle signup: %v", err)
		Handle500(c)
		return
	}

	lowerEmail := strings.ToLower(*email)
	waitlistCollection := db.Collection("waitlist")
	db_ctx, cancel := context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	count, err := waitlistCollection.CountDocuments(
		db_ctx,
		bson.M{"$and": []bson.M{{"email": lowerEmail}, {"has_access": true}}},
	)
	if err != nil {
		log.Printf("failed to query waitlist: %v", err)
		Handle500(c)
		return
	}
	if _, contains := config.ALLOWED_USERNAMES[lowerEmail]; !contains && !strings.HasSuffix(lowerEmail, "@generaltask.io") && count == 0 {
		c.JSON(403, gin.H{"detail": "Email has not been approved."})
		return
	}

	internalToken := guuid.New().String()
	internalAPITokenCollection := db.Collection("internal_api_tokens")
	db_ctx, cancel = context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	_, err = internalAPITokenCollection.UpdateOne(
		db_ctx,
		bson.M{"user_id": userID},
		bson.M{"$set": &database.InternalAPIToken{UserID: userID, Token: internalToken}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("failed to create internal token record: %v", err)
		Handle500(c)
		return
	}

	c.SetCookie("authToken", internalToken, 30*60*60*24, "/", config.GetConfigValue("COOKIE_DOMAIN"), false, false)
	c.Redirect(302, config.GetConfigValue("HOME_URL"))
}
