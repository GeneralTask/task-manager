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

func (api *API) Login(c *gin.Context) {
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	insertedStateToken := database.CreateStateToken(db, nil)
	c.SetCookie("googleStateToken", insertedStateToken, 60*60*24, "/", config.GetConfigValue("COOKIE_DOMAIN"), false, false)
	authURL := api.GoogleConfig.AuthCodeURL(insertedStateToken, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	c.Redirect(302, authURL)
}

func (api *API) LoginCallback(c *gin.Context) {
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
		err = database.DeleteStateToken(db, stateTokenID, nil)
		if err != nil {
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
	if err != nil {
		log.Fatalf("Error decoding JSON: %v", err)
	}
	if userInfo.SUB == "" {
		log.Fatal("Failed to retrieve google user ID")
	}

	lowerEmail := strings.ToLower(userInfo.EMAIL)
	waitlistCollection := db.Collection("waitlist")
	count, err := waitlistCollection.CountDocuments(
		context.TODO(),
		bson.D{{Key: "email", Value: lowerEmail}, {Key: "has_access", Value: true}},
	)
	if err != nil {
		log.Fatalf("Failed to query waitlist: %v", err)
	}
	if _, contains := ALLOWED_USERNAMES[strings.ToLower(userInfo.EMAIL)]; !contains && !strings.HasSuffix(lowerEmail, "@generaltask.io") && count == 0 {
		c.JSON(403, gin.H{"detail": "Email has not been approved."})
		return
	}

	userCollection := db.Collection("users")

	var user database.User
	var insertedUserID primitive.ObjectID
	if userCollection.FindOne(context.TODO(), bson.D{{Key: "google_id", Value: userInfo.SUB}}).Decode(&user) != nil {
		cursor, err := userCollection.InsertOne(context.TODO(), &database.User{GoogleID: userInfo.SUB, Email: userInfo.EMAIL})
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
		context.TODO(),
		bson.D{{Key: "user_id", Value: insertedUserID}, {Key: "source", Value: "google"}},
		bson.D{{Key: "$set", Value: &database.ExternalAPIToken{UserID: insertedUserID, Source: "google", Token: string(tokenString)}}},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		log.Fatalf("Failed to create external token record: %v", err)
	}
	internalToken := guuid.New().String()
	internalAPITokenCollection := db.Collection("internal_api_tokens")
	_, err = internalAPITokenCollection.UpdateOne(
		context.TODO(),
		bson.D{{Key: "user_id", Value: insertedUserID}},
		bson.D{{Key: "$set", Value: &database.InternalAPIToken{UserID: insertedUserID, Token: internalToken}}},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		log.Fatalf("Failed to create internal token record: %v", err)
	}
	c.SetCookie("authToken", internalToken, 60*60*24, "/", config.GetConfigValue("COOKIE_DOMAIN"), false, false)
	c.Redirect(302, config.GetConfigValue("HOME_URL"))
}
