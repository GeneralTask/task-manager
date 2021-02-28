package main

import (
	"context"
	"encoding/json"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"io/ioutil"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	guuid "github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
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
	EMAIL string `json:"email"`
}

// HTTPClient ...
type HTTPClient interface {
	Get(url string) (*http.Response, error)
}

type oauthConfigWrapper struct {
	Config *oauth2.Config
}

func (c *oauthConfigWrapper) AuthCodeURL(state string, opts ...oauth2.AuthCodeOption) string {
	return c.Config.AuthCodeURL(state, opts...)
}

func (c *oauthConfigWrapper) Exchange(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return c.Config.Exchange(ctx, code, opts...)
}

func (c *oauthConfigWrapper) Client(ctx context.Context, t *oauth2.Token) HTTPClient {
	return c.Config.Client(ctx, t)
}

// OauthConfigWrapper is the interface for interacting with the oauth2 config
type OauthConfigWrapper interface {
	AuthCodeURL(state string, opts ...oauth2.AuthCodeOption) string
	Client(ctx context.Context, t *oauth2.Token) HTTPClient
	Exchange(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error)
}

// API is the object containing API route handlers
type API struct {
	GoogleConfig OauthConfigWrapper
}

func getGoogleConfig() OauthConfigWrapper {
	// Taken from https://developers.google.com/people/quickstart/go
	b, err := ioutil.ReadFile("credentials.json")
	if err != nil {
		log.Fatalf("Unable to read credentials file: %v", err)
	}
	config, err := google.ConfigFromJSON(b, "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.events")
	if err != nil {
		log.Fatalf("Unable to parse credentials file to config: %v", err)
	}
	return &oauthConfigWrapper{Config: config}
}

var ALLOWED_USERNAMES = map[string]struct{} {
	"jasonscharff@gmail.com": struct{}{},
	"jreinstra@gmail.com": struct{}{},
	"john@generaltask.io": struct{}{},
	"john@robinhood.com": struct{}{},
	"scottmai702@gmail.com": struct{}{},
	"sequoia@sequoiasnow.com": struct{}{},
	"nolan1299@gmail.com": struct{}{},
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

	if _, contains := ALLOWED_USERNAMES[strings.ToLower(userInfo.EMAIL)]; !contains {
		c.JSON(403, gin.H{"detail": "Email has not been approved."})
		return
	}

	if err != nil {
		log.Fatalf("Error decoding JSON: %v", err)
	}
	if userInfo.SUB == "" {
		log.Fatal("Failed to retrieve google user ID")
	}

	db, dbCleanup := GetDBConnection()
	defer dbCleanup()
	userCollection := db.Collection("users")

	var user User
	var insertedUserID primitive.ObjectID
	if userCollection.FindOne(nil, bson.D{{Key: "google_id", Value: userInfo.SUB}}).Decode(&user) != nil {
		cursor, err := userCollection.InsertOne(nil, &User{GoogleID: userInfo.SUB})
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
		bson.D{{"user_id", insertedUserID}},
		bson.D{{"$set",  &ExternalAPIToken{UserID: insertedUserID, Source: "google", Token: string(tokenString)}}},
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
		bson.D{{"$set",  &InternalAPIToken{UserID: insertedUserID, Token: internalToken} }},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		log.Fatalf("Failed to create internal token record: %v", err)
	}
	c.SetCookie("authToken", internalToken, 60*60*24, "/", "localhost", false, false)
	homeURL := "http://localhost:3000/"
	c.Redirect(302, homeURL)
}

func (api *API) tasksList(c *gin.Context) {
	db, dbCleanup := GetDBConnection()
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")
	var googleToken ExternalAPIToken
	userID, _ := c.Get("user")
	err := externalAPITokenCollection.FindOne(nil, bson.D{{Key: "user_id", Value: userID}}).Decode(&googleToken)
	if err != nil {
		log.Fatalf("Failed to fetch external API token: %v", err)
	}

	var tasks []*Task

	var token oauth2.Token
	json.Unmarshal([]byte(googleToken.Token), &token)
	config := getGoogleConfig()
	client := config.Client(context.Background(), &token).(*http.Client)
	gmailService, err := gmail.New(client)
	if err != nil {
		log.Fatalf("Unable to create Gmail service: %v", err)
	}
	threadsResponse, err := gmailService.Users.Threads.List("me").Q("is:unread").Do()
	if err != nil {
		log.Fatalf("Failed to load Gmail threads for user: %v", err)
	}
	for _, threadListItem := range threadsResponse.Threads {
		thread, err := gmailService.Users.Threads.Get("me", threadListItem.Id).Do()
		if err != nil {
			log.Fatalf("failed to load thread! %v", err)
		}
		var sender = ""
		var title = ""
		for _, header := range thread.Messages[0].Payload.Headers {
			if header.Name == "From" {
				sender = header.Value
			}
			if header.Name == "Subject" {
				title = header.Value
			}
		}
		tasks = append(tasks, &Task{
			ID:         guuid.New().String(),
			IDExternal: threadListItem.Id,
			IDOrdering: len(tasks),
			Sender:     sender,
			Source:     "gmail",
			Title:      title,
		})
	}

	calendarService, err := calendar.New(client)
	if err != nil {
		log.Fatalf("Unable to create Calendar service: %v", err)
	}
	calendarResponse, err := calendarService.Events.List("primary").Do()
	if err != nil {
		log.Fatalf("Unable to load calendar events: %v", err)
	}
	for _, event := range calendarResponse.Items {
		tasks = append(tasks, &Task{
			ID:            guuid.New().String(),
			IDExternal:    event.Id,
			IDOrdering:    len(tasks),
			DatetimeEnd:   event.End.DateTime,
			DatetimeStart: event.Start.DateTime,
			Source:        "gcal",
			Title:         event.Summary,
		})
	}
	c.JSON(200, tasks)
}

func (api *API) ping(c *gin.Context){
	c.JSON(200, "success")
}

func tokenMiddleware(c *gin.Context) {
	token := c.Request.Header.Get("Authorization")
	//Token is 36 characters + 6 for Bearer prefix + 1 for space = 43
	if len(token) != 43 {
		c.AbortWithStatusJSON(401, gin.H{"detail": "incorrect auth token format"})
	}
	token = token[7:]
	log.Println("Token: \"" + token + "\"")
	db, dbCleanup := GetDBConnection()
	defer dbCleanup()
	internalAPITokenCollection := db.Collection("internal_api_tokens")
	var internalToken InternalAPIToken
	err := internalAPITokenCollection.FindOne(nil, bson.D{{"token", token}}).Decode(&internalToken)
	if err != nil {
		c.AbortWithStatusJSON(401, gin.H{"detail": "unauthorized"})
	}
	log.Println(internalToken.UserID)
	c.Set("user", internalToken.UserID)
}

func getRouter(api *API) *gin.Engine {
	router := gin.Default()
	// Unauthenticated endpoints
	router.GET("/login/", api.login)
	router.GET("/login/callback/", api.loginCallback)
	router.Use(tokenMiddleware)
	// Authenticated endpoints
	router.GET("/tasks/", api.tasksList)
	router.GET("/ping/", api.ping)
	return router
}

func main() {
	getRouter(&API{GoogleConfig: getGoogleConfig()}).Run()
}
