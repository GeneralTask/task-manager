package external

import (
	"context"
	"encoding/json"
	"errors"
	"log"
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
}

type GoogleService struct {
	LoginConfig     OauthConfigWrapper
	AuthorizeConfig OauthConfigWrapper
	OverrideURLs    GoogleURLOverrides
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
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.events"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/auth",
			TokenURL: "https://oauth2.googleapis.com/token",
		},
	}
	return &OauthConfig{Config: googleConfig}
}

func getGoogleAuthorizeConfig() OauthConfigWrapper {
	googleConfig := &oauth2.Config{
		ClientID:     config.GetConfigValue("GOOGLE_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("GOOGLE_OAUTH_CLIENT_SECRET"),
		RedirectURL:  config.GetConfigValue("GOOGLE_OAUTH_AUTHORIZE_REDIRECT_URL"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.events"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/auth",
			TokenURL: "https://oauth2.googleapis.com/token",
		},
	}
	return &OauthConfig{Config: googleConfig}
}

func GetGoogleHttpClient(externalAPITokenCollection *mongo.Collection, userID primitive.ObjectID, accountID string) *http.Client {
	parent_ctx := context.Background()
	var googleToken database.ExternalAPIToken

	db_ctx, cancel := context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	if err := externalAPITokenCollection.FindOne(
		db_ctx,
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"service_id": TASK_SERVICE_ID_GOOGLE},
			{"account_id": accountID},
		}}).Decode(&googleToken); err != nil {
		return nil
	}

	var token oauth2.Token
	json.Unmarshal([]byte(googleToken.Token), &token)
	config := getGoogleLoginConfig()
	ext_ctx, cancel := context.WithTimeout(parent_ctx, constants.ExternalTimeout)
	defer cancel()
	return config.Client(ext_ctx, &token).(*http.Client)
}

func (Google GoogleService) GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error) {
	authURL := Google.AuthorizeConfig.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline)
	return &authURL, nil
}

func (Google GoogleService) GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error) {
	var authURL string
	if forcePrompt {
		authURL = Google.LoginConfig.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	} else {
		authURL = Google.LoginConfig.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline)
	}
	return &authURL, nil
}

func (Google GoogleService) HandleLinkCallback(code string, userID primitive.ObjectID) error {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	token, err := Google.LoginConfig.Exchange(context.Background(), code)
	if err != nil {
		log.Printf("failed to fetch token from google: %v", err)
		return err
	}
	client := Google.LoginConfig.Client(context.Background(), token)
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

	externalAPITokenCollection := db.Collection("external_api_tokens")

	count, err := externalAPITokenCollection.CountDocuments(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"service_id": TASK_SERVICE_ID_GOOGLE},
			{"account_id": userInfo.EMAIL},
			{"is_primary_login": true},
		}})

	if count > 0 {
		return errors.New("Already exists as primary")
	}

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
			IsUnlinkable:   false,
			IsPrimaryLogin: false,
		}},
		options.Update().SetUpsert(true),
	)
	return nil
}

func (Google GoogleService) HandleSignupCallback(code string) (primitive.ObjectID, *string, error) {
	parent_ctx := context.Background()

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return primitive.NilObjectID, nil, err
	}
	defer dbCleanup()

	ext_ctx, cancel := context.WithTimeout(parent_ctx, constants.ExternalTimeout)
	defer cancel()
	token, err := Google.LoginConfig.Exchange(ext_ctx, code)
	if err != nil {
		log.Printf("failed to fetch token from google: %v", err)

		return primitive.NilObjectID, nil, err
	}
	ext_ctx, cancel = context.WithTimeout(parent_ctx, constants.ExternalTimeout)
	defer cancel()
	client := Google.LoginConfig.Client(ext_ctx, token)
	response, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		log.Printf("failed to load user info: %v", err)

		return primitive.NilObjectID, nil, err
	}
	defer response.Body.Close()
	var userInfo GoogleUserInfo

	err = json.NewDecoder(response.Body).Decode(&userInfo)
	if err != nil {
		log.Printf("error decoding JSON: %v", err)

		return primitive.NilObjectID, nil, err
	}
	if userInfo.SUB == "" {
		log.Println("failed to retrieve google user ID")
		return primitive.NilObjectID, nil, err
	}

	userCollection := db.Collection("users")

	var user database.User

	db_ctx, cancel := context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	userCollection.FindOneAndUpdate(
		db_ctx,
		bson.M{"google_id": userInfo.SUB},
		bson.M{"$set": &database.User{GoogleID: userInfo.SUB, Email: userInfo.EMAIL, Name: userInfo.Name}},
		options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After),
	).Decode(&user)

	if user.ID == primitive.NilObjectID {
		log.Printf("unable to create user")

		return primitive.NilObjectID, nil, err
	}

	if len(token.RefreshToken) > 0 {
		// Only update / save the external API key if refresh token is set (isn't set after first authorization)
		tokenString, err := json.Marshal(&token)
		if err != nil {
			log.Printf("failed to serialize token json: %v", err)

			return primitive.NilObjectID, nil, err
		}
		externalAPITokenCollection := db.Collection("external_api_tokens")
		db_ctx, cancel = context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
		defer cancel()
		_, err = externalAPITokenCollection.UpdateOne(
			db_ctx,
			bson.M{"$and": []bson.M{
				{"user_id": user.ID},
				{"service_id": TASK_SERVICE_ID_GOOGLE},
				{"account_id": userInfo.EMAIL},
			}},
			bson.M{"$set": &database.ExternalAPIToken{
				UserID:         user.ID,
				ServiceID:      TASK_SERVICE_ID_GOOGLE,
				Token:          string(tokenString),
				AccountID:      userInfo.EMAIL,
				DisplayID:      userInfo.EMAIL,
				IsUnlinkable:   false,
				IsPrimaryLogin: true,
			}},
			options.Update().SetUpsert(true),
		)
		if err != nil {
			log.Printf("failed to create external token record: %v", err)

			return primitive.NilObjectID, nil, err
		}
	}

	return user.ID, &userInfo.EMAIL, nil
}
