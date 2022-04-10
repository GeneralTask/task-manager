package external

import (
	"context"
	"encoding/json"
	"github.com/rs/zerolog/log"
	"net/http"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

type GoogleURLOverrides struct {
	CalendarFetchURL *string
	GmailModifyURL   *string
	GmailReplyURL    *string
	GmailSendURL     *string
}

type GoogleService struct {
	LoginConfig  OauthConfigWrapper
	LinkConfig   OauthConfigWrapper
	OverrideURLs GoogleURLOverrides
}

// GoogleUserInfo ...
type GoogleUserInfo struct {
	SUB   string `json:"sub"`
	EMAIL string `json:"email"`
	Name  string `json:"name"`
}

func getGoogleLoginConfig() OauthConfigWrapper {
	googleConfig := &oauth2.Config{
		ClientID:     config.GetConfigValue("GOOGLE_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("GOOGLE_OAUTH_CLIENT_SECRET"),
		RedirectURL:  config.GetConfigValue("GOOGLE_OAUTH_LOGIN_REDIRECT_URL"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/auth",
			TokenURL: "https://oauth2.googleapis.com/token",
		},
	}
	return &OauthConfig{Config: googleConfig}
}

func getGoogleLinkConfig() OauthConfigWrapper {
	googleConfig := &oauth2.Config{
		ClientID:     config.GetConfigValue("GOOGLE_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("GOOGLE_OAUTH_CLIENT_SECRET"),
		RedirectURL:  config.GetConfigValue("GOOGLE_OAUTH_AUTHORIZE_REDIRECT_URL"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/auth",
			TokenURL: "https://oauth2.googleapis.com/token",
		},
	}
	return &OauthConfig{Config: googleConfig}
}

func getGoogleHttpClient(db *mongo.Database, userID primitive.ObjectID, accountID string) *http.Client {
	return getExternalOauth2Client(db, userID, accountID, TASK_SERVICE_ID_GOOGLE, getGoogleLoginConfig())
}

func (Google GoogleService) GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error) {
	authURL := Google.LinkConfig.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	return &authURL, nil
}

func (Google GoogleService) GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error) {
	var authURL string
	includeGrantedScopes := oauth2.SetAuthURLParam("include_granted_scopes", "false")
	if forcePrompt {
		authURL = Google.LoginConfig.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, includeGrantedScopes, oauth2.ApprovalForce)
	} else {
		authURL = Google.LoginConfig.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, includeGrantedScopes)
	}
	return &authURL, nil
}

func (Google GoogleService) HandleLinkCallback(params CallbackParams, userID primitive.ObjectID) error {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}

	defer dbCleanup()
	token, err := Google.LinkConfig.Exchange(context.Background(), *params.Oauth2Code)
	if err != nil {
		log.Printf("failed to fetch token from google: %v", err)
		return err
	}
	client := Google.LinkConfig.Client(context.Background(), token)
	response, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		log.Printf("failed to load user info: %v", err)
		return err
	}
	defer response.Body.Close()
	var userInfo GoogleUserInfo

	err = json.NewDecoder(response.Body).Decode(&userInfo)
	if err != nil {
		log.Printf("failed to load decode user info: %v", err)
		return err
	}
	tokenString, err := json.Marshal(&token)
	if err != nil {
		log.Printf("failed to load token: %v", err)
		return err
	}

	externalAPITokenCollection := database.GetExternalTokenCollection(db)

	_, err = externalAPITokenCollection.UpdateOne(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"service_id": TASK_SERVICE_ID_GOOGLE},
			{"account_id": userInfo.EMAIL},
		}},
		bson.M{"$set": &database.ExternalAPIToken{
			UserID:         userID,
			ServiceID:      TASK_SERVICE_ID_GOOGLE,
			Token:          string(tokenString),
			AccountID:      userInfo.EMAIL,
			DisplayID:      userInfo.EMAIL,
			IsUnlinkable:   true,
			IsPrimaryLogin: false,
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("failed to fetch token from google: %v", err)
		return err
	}
	return nil
}

func (Google GoogleService) HandleSignupCallback(params CallbackParams) (primitive.ObjectID, *bool, *string, error) {
	parentCtx := context.Background()

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return primitive.NilObjectID, nil, nil, err
	}
	defer dbCleanup()

	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	token, err := Google.LoginConfig.Exchange(extCtx, *params.Oauth2Code)
	if err != nil {
		log.Printf("failed to fetch token from google: %v", err)

		return primitive.NilObjectID, nil, nil, err
	}
	extCtx, cancel = context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	client := Google.LoginConfig.Client(extCtx, token)
	response, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		log.Printf("failed to load user info: %v", err)

		return primitive.NilObjectID, nil, nil, err
	}
	defer response.Body.Close()
	var userInfo GoogleUserInfo

	err = json.NewDecoder(response.Body).Decode(&userInfo)
	if err != nil {
		log.Printf("error decoding JSON: %v", err)

		return primitive.NilObjectID, nil, nil, err
	}
	if userInfo.SUB == "" {
		log.Print("failed to retrieve google user ID")
		return primitive.NilObjectID, nil, nil, err
	}

	userCollection := database.GetUserCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	count, err := userCollection.CountDocuments(
		dbCtx,
		bson.M{"google_id": userInfo.SUB},
	)
	if err != nil {
		log.Printf("")
	}
	userIsNew := count == int64(0)

	var user database.User

	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	userCollection.FindOneAndUpdate(
		dbCtx,
		bson.M{"google_id": userInfo.SUB},
		bson.M{"$set": &database.User{GoogleID: userInfo.SUB, Email: userInfo.EMAIL, Name: userInfo.Name}},
		options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After),
	).Decode(&user)

	if user.ID == primitive.NilObjectID {
		log.Printf("unable to create user")

		return primitive.NilObjectID, &userIsNew, nil, err
	}

	return user.ID, &userIsNew, &userInfo.EMAIL, nil
}
