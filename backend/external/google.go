package external

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/oauth2"
)

type GoogleURLOverrides struct {
	CalendarFetchURL *string
	GmailModifyURL   *string
	GmailReplyURL    *string
}

type GoogleService struct {
	Config       OauthConfigWrapper
	OverrideURLs GoogleURLOverrides
}

func GetGoogleConfig() OauthConfigWrapper {
	googleConfig := &oauth2.Config{
		ClientID:     config.GetConfigValue("GOOGLE_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("GOOGLE_OAUTH_CLIENT_SECRET"),
		RedirectURL:  config.GetConfigValue("GOOGLE_OAUTH_REDIRECT_URL"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.events"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/auth",
			TokenURL: "https://oauth2.googleapis.com/token",
		},
	}
	return &OauthConfig{Config: googleConfig}
}

func GetGoogleHttpClient(externalAPITokenCollection *mongo.Collection, userID primitive.ObjectID, accountID string) *http.Client {
	var googleToken database.ExternalAPIToken

	if err := externalAPITokenCollection.FindOne(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"source": "google"},
			{"account_id": accountID},
		}}).Decode(&googleToken); err != nil {
		return nil
	}

	var token oauth2.Token
	json.Unmarshal([]byte(googleToken.Token), &token)
	config := GetGoogleConfig()
	return config.Client(context.Background(), &token).(*http.Client)
}

func (Google GoogleService) GetLinkURL(userID primitive.ObjectID) (string, error) {
	return "", errors.New("google does not support linking")
}

func (Google GoogleService) GetSignupURL(userID primitive.ObjectID) (string, error) {
	return "", errors.New("google does not support signup")
}

func (Google GoogleService) HandleLinkCallback(code string, stateTokenID primitive.ObjectID, userID primitive.ObjectID) error {
	return errors.New("google does not support linking")
}

func (Google GoogleService) HandleSignupCallback(code string, stateTokenID primitive.ObjectID, userID primitive.ObjectID) error {
	return errors.New("google does not support signup")
}
