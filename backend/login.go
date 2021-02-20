package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/martian/log"
	guuid "github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

// A Google user as returned by a query to userinfo. This type only represents
// the subset of the response which we are interested in.
type GoogleUserInfo struct {
	// The unique identifier of a user used by Google. This allows us to
	// differentiate between logging a user in and creating a new user. It also is
	// useful for the querying of some google API's.
	SUB string `json:"sub"`
	EMAIL string `json:"email"`
}

// A subset of the response fields of a google redirect response. For more
// information see
//   https://developers.google.com/identity/protocols/oauth2/web-server
type GoogleRedirectParams struct {
	State string `form:"state"`
	Code  string `form:"code"`
	Scope string `form:"scope"`
}

// Parse the response body from Google. This by default should be a JSON object
// containing at a minimum
//
//   scope          - the requested scopes from google
//   code           - an exchange token
//   state          - the state we provided in making the request
//
// For more information see:
//   https://developers.google.com/identity/protocols/oauth2/web-server
//
// In order to verify the response is coming from the same server, and prevent
// cross-site forgery's we check if the Session State token matches that in the
// response.
func parseOauthTokenResponse(c *gin.Context, params *GoogleRedirectParams) error {
	// Parses the body as GoogleRedirectParams
	if err := c.ShouldBind(&params); err != nil {
		return err
	}

	// Check if session's state cookie matches the incoming request.
	stateCookie, err := c.Cookie("state")
	if err != nil || stateCookie != params.State {
		return errors.New("Could not verify state token, potential cross-site forgery")
	}

	return nil
}


// Lookup a users information using the access token provided by google. Note
// that we can avoid this request by parsing the `id_sub` entry in the google
// config entry, however, for the moment this is simpler. For more information
// on querying a user's details see:
//   https://developers.google.com/identity/sign-in/web/backend-auth
func (api *API) userInfoFromToken(client HTTPClient, userInfo *GoogleUserInfo) error {
	response, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		return err
	}

	defer response.Body.Close()

	err = json.NewDecoder(response.Body).Decode(&userInfo)
	if err != nil {
		return err
	}

	if userInfo.SUB == "" {
		return errors.New("User parsed, but returned without SUB field")
	}

	return nil
}

// Create or retrieve a google user from the database.  Note that when looking
// up a user we are NOT using their internal id but rather their unique google
// identifier, as expressed in the SUB field.
func (api *API) getOrCreateUser(gu GoogleUserInfo, u *User) error {
	db, dbCleanup := GetDBConnection()
	defer dbCleanup()

	userCollection := db.Collection("users")

	if userCollection.FindOne(nil, bson.D{{"google_id", gu.SUB}}).Decode(&u) != nil {
		cursor, err := userCollection.InsertOne(nil, &User{GoogleID: gu.SUB})
		if err != nil {
			log.Errorf("Failed to create new user in the database: %v", err)
			return err
		}

		u.ID = cursor.InsertedID.(primitive.ObjectID)
		u.GoogleID = gu.SUB
	}
	return nil
}

// Save the auth token in the ExternalAPIToken collection for future use. Then
// we create an Internal token to validate a user via authentication with the
// frontend. Note that, since we get a new google token on every login there's
// no reason to keep them in the ExternalAPIToken collection past the most
// recent entry, so we use create or replace.
//
// The function returns the internal identifying token for the user
func (api *API) saveUserTokens(c *gin.Context, gtoken *oauth2.Token, u *User) (string, error) {
	db, dbCleanup := GetDBConnection()
	defer dbCleanup()

	tokenString, err := json.Marshal(&gtoken)
	if err != nil {
		return "", err
	}

	extTokens := db.Collection("external_api_tokens")
	_, err = extTokens.UpdateOne(
		nil,
		bson.D{{"user_id", u.ID}, {"source", "google"}},
		bson.D{{"$set", &ExternalAPIToken{UserID: u.ID, Source: "google", Token: string(tokenString)}}},
		options.Update().SetUpsert(true))
	if err != nil {
		return "", err
	}

	// Create an internal token to validate our user, and return it (in the future
	// this needs an expiration date, or better yet will become a JWT)
	return createTokenForUser(c, u)
}


// Process the callaback response of a google oauth request. This includes
// verifying the request is not a forgery via the `parseOauthTokenResponse`
// method, decoding the user details and either logging them in or placing them
// in the database if they are new users.
func (api *API) loginCallback(c *gin.Context) {
	// Parse the response from google
	var redirectParams GoogleRedirectParams
	if err := parseOauthTokenResponse(c, &redirectParams); err != nil {
		log.Errorf("Could not parse OAuth Token Response: %v", err)
		c.AbortWithStatus(http.StatusBadRequest)
	}

	// Exchange the redirect code for an oauth token
	gtoken, err := api.GoogleConfig.Exchange(context.Background(), redirectParams.Code)
	if err != nil {
		log.Errorf("Could not process exchange token: %v", err)
		c.AbortWithStatus(http.StatusInternalServerError)
	}

	// Get an http client to query google API's using our new token
	client := api.GoogleConfig.Client(context.Background(), gtoken)

	// Using the token, parse the user information.
	var userInfo GoogleUserInfo
	if err := api.userInfoFromToken(client, &userInfo); err != nil {
		log.Errorf("Could not retrieve user information from google: %v", err)
		c.AbortWithStatus(http.StatusInternalServerError)
	}

	// Check if a user is in the aproved whitelist
	if _, contains := api.InternalConfig.WhitelistedUsers[strings.ToLower(userInfo.EMAIL)]; !contains {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"detail": "Email has not been aproved" })
	}

	// Retrieve the full user from the database
	var user User
	if err := api.getOrCreateUser(userInfo, &user); err != nil {
		log.Errorf("Could not get user from database: %v", err)
		c.AbortWithStatus(http.StatusInternalServerError)
	}

	// Login user with a new token, and set the corresponding session token
	// (currently unused).
	token, err := api.saveUserTokens(c, gtoken, &user)
	if err != nil {
		log.Errorf("Could not create a token to identify a user: %v", err)
		c.AbortWithStatus(http.StatusInternalServerError)
	}

	// Return the token information
	c.JSON(200, gin.H{
		"state":          redirectParams.State,
		"code":           redirectParams.Code,
		"user_id":        userInfo.SUB,
		"user_pk":        user.ID,
		"token":          token,
		"internal_token": token,
		"scope":          redirectParams.Scope,
	})
}


// The login endpoint is simply a proxy which redirects to google login. Upon
// completion this then redirects to the loginCallback. In order to prevent
// cross site forgery we set a state token, for more information see
// parseOauthTokenResponse
func (api *API) login(c *gin.Context) {
	// Generate a state token and set cookie for CSFR
	stateToken := guuid.New().String()
	c.SetCookie("state", stateToken, 60 * 60, "/", "localhost", false, false)

	authURL := api.GoogleConfig.AuthCodeURL(stateToken, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	c.Redirect(302, authURL)
}
