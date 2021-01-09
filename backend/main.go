package main

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"log"

	"github.com/gin-gonic/gin"
	guuid "github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/gmail/v1"
)

// GoogleRedirectParams ...
type GoogleRedirectParams struct {
	State string `form:"state"`
	Code  string `form:"code"`
	Scope string `form:"scope"`
}

// GoogleUserInfo ...
type GoogleUserInfo struct {
	SUB string `json:"sub"`
}

// API is the object containing API route handlers
type API struct {
	GoogleConfig *oauth2.Config
}

func getGoogleConfig() *oauth2.Config {
	// Taken from https://developers.google.com/people/quickstart/go
	b, err := ioutil.ReadFile("credentials.json")
	if err != nil {
		log.Fatalf("Unable to read credentials file: %v", err)
	}
	config, err := google.ConfigFromJSON(b, "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.events")
	if err != nil {
		log.Fatalf("Unable to parse credentials file to config: %v", err)
	}
	return config
}

func (api *API) login(c *gin.Context) {
	authURL := api.GoogleConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	c.Redirect(302, authURL)
}

func (api *API) loginCallback(c *gin.Context) {
	var redirectParams GoogleRedirectParams
	if c.ShouldBind(&redirectParams) != nil || redirectParams.State == "" || redirectParams.Code == "" || redirectParams.Scope == "" {
		c.JSON(400, gin.H{"detail": "Missing query params"})
		return
	}
	token, err := api.GoogleConfig.Exchange(context.TODO(), redirectParams.Code)
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

	db := GetDBConnection()
	userCollection := db.Collection("users")
	cursor, err := userCollection.InsertOne(nil, &User{GoogleID: userInfo.SUB})
	insertedUserID := cursor.InsertedID.(primitive.ObjectID)
	if err != nil {
		log.Fatalf("Failed to create new user in db: %v", err)
	}
	tokenString, err := json.Marshal(&token)
	if err != nil {
		log.Fatalf("Failed to serialize token json: %v", err)
	}
	externalAPITokenCollection := db.Collection("external_api_tokens")
	_, err = externalAPITokenCollection.InsertOne(nil, &ExternalAPIToken{UserID: insertedUserID, Source: "google", Token: string(tokenString)})
	if err != nil {
		log.Fatalf("Failed to create external token record: %v", err)
	}
	internalToken := guuid.New().String()
	internalAPITokenCollection := db.Collection("internal_api_tokens")
	_, err = internalAPITokenCollection.InsertOne(nil, &InternalAPIToken{UserID: insertedUserID, Token: internalToken})
	if err != nil {
		log.Fatalf("Failed to create internal token record: %v", err)
	}
	c.SetCookie("authToken", internalToken, 60*60*24, "/", "localhost", false, false)
	c.JSON(200, gin.H{
		"state":          redirectParams.State,
		"code":           redirectParams.Code,
		"user_id":        userInfo.SUB,
		"user_pk":        insertedUserID,
		"token":          token,
		"internal_token": internalToken,
		"scope":          redirectParams.Scope,
	})
}

func (api *API) tasksList(c *gin.Context) {
	db := GetDBConnection()
	externalAPITokenCollection := db.Collection("external_api_tokens")
	var googleToken ExternalAPIToken
	err := externalAPITokenCollection.FindOne(nil, bson.D{{Key: "user_id", Value: 1}}).Decode(&googleToken)
	if err != nil {
		log.Fatalf("Failed to fetch external API token: %v", err)
	}

	var token oauth2.Token
	json.Unmarshal([]byte(googleToken.Token), &token)
	config := getGoogleConfig()
	client := config.Client(context.Background(), &token)
	gmailService, err := gmail.New(client)
	if err != nil {
		log.Fatalf("Unable to create Gmail service: %v", err)
	}
	response, err := gmailService.Users.Threads.List("me").Q("is:unread").Do()
	if err != nil {
		log.Printf("Failed to load Gmail threads for user: %v", err)
	}

	calendarService, err := calendar.New(client)
	if err != nil {
		log.Fatalf("Unable to create Calendar service: %v", err)
	}
	calendarResponse, err := calendarService.Events.List("primary").Do()
	c.JSON(200, gin.H{"go": "fuck yourself!", "token": googleToken.Token, "token2": token, "response": response, "calendar": calendarResponse})
}

func getRouter(api *API) *gin.Engine {
	r := gin.Default()
	r.GET("/login/", api.login)
	r.GET("/login/callback/", api.loginCallback)
	r.GET("/tasks/", api.tasksList)
	return r
}

func main() {
	getRouter(&API{GoogleConfig: getGoogleConfig()}).Run()
}
