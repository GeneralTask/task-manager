// https://golang.org/doc/editors.html
// https://marketplace.visualstudio.com/items?itemName=golang.go
// https://golang.org/cmd/go/#hdr-GOPATH_environment_variable
package main

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"log"

	"github.com/gin-gonic/gin"
	guuid "github.com/google/uuid"
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

func login(c *gin.Context) {
	config := getGoogleConfig()
	authURL := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	c.Redirect(302, authURL)
}

func loginCallback(c *gin.Context) {
	var redirectParams GoogleRedirectParams
	if c.ShouldBind(&redirectParams) != nil || redirectParams.State == "" || redirectParams.Code == "" || redirectParams.Scope == "" {
		c.JSON(400, gin.H{"detail": "Missing query params"})
		return
	}
	config := getGoogleConfig()
	token, err := config.Exchange(context.TODO(), redirectParams.Code)
	if err != nil {
		log.Fatalf("Failed to fetch token from google: %v", err)
	}
	client := config.Client(context.Background(), token)
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

	db := getDBConnection()
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

func tasksList(c *gin.Context) {
	db := getDBConnection()
	var googleToken ExternalAPIToken
	db.Last(&googleToken, "user_id = ?", 1)
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

func main() {
	r := gin.Default()
	r.GET("/login/", login)
	r.GET("/login/callback/", loginCallback)
	r.GET("/tasks/", tasksList)
	r.Run()
}
