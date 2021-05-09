package api

import (
	"context"
	"encoding/json"
	"log"
	"strings"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	guuid "github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

func (api *API) login(c *gin.Context) {
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	stateTokenCollection := db.Collection("state_tokens")
	cursor, err := stateTokenCollection.InsertOne(nil, &database.StateToken{})
	if err != nil {
		log.Fatalf("Failed to create new state token: %v", err)
	}
	insertedStateToken := cursor.InsertedID.(primitive.ObjectID).Hex()
	c.SetCookie("googleStateToken", insertedStateToken, 60*60*24, "/", config.GetConfigValue("COOKIE_DOMAIN"), false, false)
	authURL := api.GoogleConfig.AuthCodeURL(insertedStateToken, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	c.Redirect(302, authURL)
}

func (api *API) loginCallback(c *gin.Context) {
	var redirectParams GoogleRedirectParams
	if c.ShouldBind(&redirectParams) != nil || redirectParams.State == "" || redirectParams.Code == "" || redirectParams.Scope == "" {
		c.JSON(400, gin.H{"detail": "Missing query params"})
		return
	}

	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()

	if !api.SkipStateTokenCheck {
		stateTokenID, err := primitive.ObjectIDFromHex(redirectParams.State)
		if err != nil {
			c.JSON(400, gin.H{"detail": "Invalid state token format"})
			return
		}
		stateTokenFromCookie, _ := c.Cookie("googleStateToken")
		stateTokenIDFromCookie, err := primitive.ObjectIDFromHex(stateTokenFromCookie)
		if err != nil {
			c.JSON(400, gin.H{"detail": "Invalid state token cookie format"})
			return
		}
		if stateTokenID != stateTokenIDFromCookie {
			c.JSON(400, gin.H{"detail": "State token does not match cookie"})
			return
		}
		stateTokenCollection := db.Collection("state_tokens")
		result, err := stateTokenCollection.DeleteOne(nil, bson.D{{"_id", stateTokenID}})
		if err != nil {
			log.Fatalf("Failed to delete state token: %v", err)
		}
		if result.DeletedCount != 1 {
			c.JSON(400, gin.H{"detail": "Invalid state token"})
			return
		}
	}

	token, err := api.GoogleConfig.Exchange(context.Background(), redirectParams.Code)
	if err != nil {
		log.Fatalf("Failed to fetch token from google: %v", err)
	}
	client := api.GoogleConfig.Client(context.Background(), token)
	response, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		log.Fatalf("Failed to load user info: %v", err)
	}
	defer response.Body.Close()
	var userInfo GoogleUserInfo

	err = json.NewDecoder(response.Body).Decode(&userInfo)

	lowerEmail := strings.ToLower(userInfo.EMAIL)
	if _, contains := ALLOWED_USERNAMES[strings.ToLower(userInfo.EMAIL)]; !contains && !strings.HasSuffix(lowerEmail, "@generaltask.io") {
		c.JSON(403, gin.H{"detail": "Email has not been approved."})
		return
	}

	if err != nil {
		log.Fatalf("Error decoding JSON: %v", err)
	}
	if userInfo.SUB == "" {
		log.Fatal("Failed to retrieve google user ID")
	}

	userCollection := db.Collection("users")

	var user database.User
	var insertedUserID primitive.ObjectID
	if userCollection.FindOne(nil, bson.D{{Key: "google_id", Value: userInfo.SUB}}).Decode(&user) != nil {
		cursor, err := userCollection.InsertOne(nil, &database.User{GoogleID: userInfo.SUB, Email: userInfo.EMAIL})
		insertedUserID = cursor.InsertedID.(primitive.ObjectID)
		if err != nil {
			log.Fatalf("Failed to create new user in db: %v", err)
		}
	} else {
		insertedUserID = user.ID
	}

	tokenString, err := json.Marshal(&token)
	if err != nil {
		log.Fatalf("Failed to serialize token json: %v", err)
	}
	externalAPITokenCollection := db.Collection("external_api_tokens")
	_, err = externalAPITokenCollection.UpdateOne(
		nil,
		bson.D{{"user_id", insertedUserID}, {"source", "google"}},
		bson.D{{"$set", &database.ExternalAPIToken{UserID: insertedUserID, Source: "google", Token: string(tokenString)}}},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		log.Fatalf("Failed to create external token record: %v", err)
	}
	internalToken := guuid.New().String()
	internalAPITokenCollection := db.Collection("internal_api_tokens")
	_, err = internalAPITokenCollection.UpdateOne(
		nil,
		bson.D{{"user_id", insertedUserID}},
		bson.D{{"$set", &database.InternalAPIToken{UserID: insertedUserID, Token: internalToken}}},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		log.Fatalf("Failed to create internal token record: %v", err)
	}
	c.SetCookie("authToken", internalToken, 60*60*24, "/", config.GetConfigValue("COOKIE_DOMAIN"), false, false)
	c.Redirect(302, config.GetConfigValue("HOME_URL"))
}
