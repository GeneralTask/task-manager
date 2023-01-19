package external

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"golang.org/x/exp/slices"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

type GoogleURLOverrides struct {
	CalendarFetchURL  *string
	CalendarCreateURL *string
	CalendarModifyURL *string
	CalendarDeleteURL *string
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

// GoogleTokenInfo ...
type GoogleTokenInfo struct {
	Scope string `json:"scope"`
}

func getGoogleLoginConfig() OauthConfigWrapper {
	googleConfig := &oauth2.Config{
		ClientID:     config.GetConfigValue("GOOGLE_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("GOOGLE_OAUTH_CLIENT_SECRET"),
		RedirectURL:  config.GetConfigValue("GOOGLE_OAUTH_LOGIN_REDIRECT_URL"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar"},
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
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/auth",
			TokenURL: "https://oauth2.googleapis.com/token",
		},
	}
	return &OauthConfig{Config: googleConfig}
}

func getGoogleLinkConfigForEmployees() OauthConfigWrapper {
	googleConfig := &oauth2.Config{
		ClientID:     config.GetConfigValue("GOOGLE_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("GOOGLE_OAUTH_CLIENT_SECRET"),
		RedirectURL:  config.GetConfigValue("GOOGLE_OAUTH_AUTHORIZE_REDIRECT_URL"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar"},
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
	var authURL string
	db, cleanup, err := database.GetDBConnection()
	defer cleanup()
	if err != nil {
		authURL = Google.LinkConfig.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
		return &authURL, nil
	}

	user, err := database.GetUser(db, userID)
	if err == nil && strings.HasSuffix(strings.ToLower(user.Email), "@generaltask.com") {
		authURL = getGoogleLinkConfigForEmployees().AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	} else {
		authURL = Google.LinkConfig.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	}
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

func (Google GoogleService) HandleLinkCallback(db *mongo.Database, params CallbackParams, userID primitive.ObjectID) error {
	token, err := Google.LinkConfig.Exchange(context.Background(), *params.Oauth2Code)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch token from google")
		return err
	}
	client := Google.LinkConfig.Client(context.Background(), token)
	response, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		logger.Error().Err(err).Msg("failed to load user info")
		return err
	}
	defer response.Body.Close()
	var userInfo GoogleUserInfo

	err = json.NewDecoder(response.Body).Decode(&userInfo)
	if err != nil {
		logger.Error().Err(err).Msg("failed to load decode user info")
		return err
	}
	tokenString, err := json.Marshal(&token)
	if err != nil {
		logger.Error().Err(err).Msg("failed to load token")
		return err
	}

	externalAPITokenCollection := database.GetExternalTokenCollection(db)

	_, err = externalAPITokenCollection.UpdateOne(
		context.Background(),
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
			Scopes:         getGoogleGrantedScopes(&client, token),
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch token from google")
		return err
	}
	return nil
}

func getGoogleGrantedScopes(client *HTTPClient, token *oauth2.Token) []string {
	tokenResponse, err := (*client).Get(fmt.Sprintf("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=%s", token.AccessToken))
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to load token info")
		return []string{}
	}
	defer tokenResponse.Body.Close()

	var tokenInfo GoogleTokenInfo
	err = json.NewDecoder(tokenResponse.Body).Decode(&tokenInfo)
	if err != nil {
		logger.Error().Err(err).Msg("error decoding JSON")
		return []string{}
	}
	return strings.Split(tokenInfo.Scope, " ")
}

func hasUserGrantedCalendarScope(client *HTTPClient, token *oauth2.Token) bool {
	scopes := getGoogleGrantedScopes(client, token)
	return slices.Contains(scopes, "https://www.googleapis.com/auth/calendar.events") || slices.Contains(scopes, "https://www.googleapis.com/auth/calendar")
}

func hasUserGrantedMultiCalendarScope(scopes []string) bool {
	return slices.Contains(scopes, "https://www.googleapis.com/auth/calendar")
}

func (Google GoogleService) HandleSignupCallback(db *mongo.Database, params CallbackParams) (primitive.ObjectID, *bool, *string, error) {
	parentCtx := context.Background()

	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	token, err := Google.LoginConfig.Exchange(extCtx, *params.Oauth2Code)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch token from google")

		return primitive.NilObjectID, nil, nil, err
	}
	extCtx, cancel = context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	client := Google.LoginConfig.Client(extCtx, token)
	response, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		logger.Error().Err(err).Msg("failed to load user info")

		return primitive.NilObjectID, nil, nil, err
	}
	defer response.Body.Close()
	var userInfo GoogleUserInfo

	err = json.NewDecoder(response.Body).Decode(&userInfo)
	if err != nil {
		logger.Error().Err(err).Msg("error decoding JSON")

		return primitive.NilObjectID, nil, nil, err
	}
	if userInfo.SUB == "" {
		log.Print("failed to retrieve google user ID")
		return primitive.NilObjectID, nil, nil, err
	}

	userCollection := database.GetUserCollection(db)

	count, err := userCollection.CountDocuments(
		context.Background(),
		bson.M{"google_id": userInfo.SUB},
	)
	if err != nil {
		logger.Error().Err(err).Send()
	}
	userIsNew := count == int64(0)

	var user database.User

	userNew := &database.User{GoogleID: userInfo.SUB, Email: userInfo.EMAIL, Name: userInfo.Name, CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC())}
	userChangeable := &database.UserChangeable{Email: userInfo.EMAIL, Name: userInfo.Name}

	log.Debug().Msgf("userNew: %+v", userNew)
	userCollection.FindOneAndUpdate(context.Background(),
		bson.M{"google_id": userInfo.SUB},
		bson.M{"$setOnInsert": userNew},
		options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After))

	log.Debug().Msgf("userChangeable: %+v", userChangeable)
	err = userCollection.FindOneAndUpdate(
		context.Background(),
		bson.M{"google_id": userInfo.SUB},
		bson.M{"$set": userChangeable},
		options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After),
	).Decode(&user)
	if err != nil {
		logger.Error().Err(err).Msg("error decoding user object")
		return primitive.NilObjectID, nil, nil, err
	}

	if user.ID == primitive.NilObjectID {
		logger.Error().Msg("unable to create user")
		return primitive.NilObjectID, &userIsNew, nil, err
	}

	// Only update / save the external API key if refresh token is set (isn't set after first authorization) and user granted scope to calendar
	if (len(token.RefreshToken) > 0) && hasUserGrantedCalendarScope(&client, token) {
		tokenString, err := json.Marshal(&token)
		if err != nil {
			log.Printf("failed to serialize token json: %v", err)

			return primitive.NilObjectID, &userIsNew, nil, err
		}
		externalAPITokenCollection := database.GetExternalTokenCollection(db)
		_, err = externalAPITokenCollection.UpdateOne(
			context.Background(),
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
				Scopes:         getGoogleGrantedScopes(&client, token),
			}},
			options.Update().SetUpsert(true),
		)
		if err != nil {
			log.Printf("failed to create external token record: %v", err)

			return primitive.NilObjectID, &userIsNew, nil, err
		}
	}

	return user.ID, &userIsNew, &userInfo.EMAIL, nil
}
