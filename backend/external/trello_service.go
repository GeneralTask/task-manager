package external

import (
	"context"
	"encoding/json"
	"errors"
	"log"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/dghubble/oauth1"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

type TrelloService struct {
	Config *oauth1.Config
}

func getTrelloConfig() *oauth1.Config {
	return &oauth1.Config{
		ConsumerKey:    config.GetConfigValue("TRELLO_OAUTH_CLIENT_ID"),
		ConsumerSecret: config.GetConfigValue("TRELLO_OAUTH_CLIENT_SECRET"),
		CallbackURL:    config.GetConfigValue("SERVER_URL") + "authorize/trello/callback/",
		Endpoint: oauth1.Endpoint{
			RequestTokenURL: "https://trello.com/1/OAuthGetRequestToken",
			AuthorizeURL:    "https://trello.com/1/OAuthAuthorizeToken",
			AccessTokenURL:  "https://trello.com/1/OAuthGetAccessToken",
		},
	}
}

func (Trello TrelloService) GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error) {
	requestToken, requestSecret, err = Trello.Config.RequestToken()
	authURL := Trello.Config.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	return &authURL, nil
}

func (Trello TrelloService) GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error) {
	return nil, errors.New("trello does not support signup")
}

func (Trello TrelloService) HandleLinkCallback(code string, userID primitive.ObjectID) error {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return errors.New("internal server error")
	}
	defer dbCleanup()

	token, err := Trello.Config.Exchange(context.Background(), code)
	if err != nil {
		log.Printf("failed to fetch token from trello: %v", err)
		return errors.New("internal server error")
	}

	tokenString, err := json.Marshal(&token)
	if err != nil {
		log.Printf("error parsing token: %v", err)
		return errors.New("internal server error")
	}

	externalAPITokenCollection := db.Collection("external_api_tokens")
	_, err = externalAPITokenCollection.UpdateOne(
		context.TODO(),
		bson.M{"$and": []bson.M{{"user_id": userID}, {"service_id": TASK_SERVICE_ID_TRELLO}}},
		bson.M{"$set": &database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: TASK_SERVICE_ID_TRELLO,
			Token:     string(tokenString)}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("error saving token: %v", err)
		return errors.New("internal server error")
	}
	return nil
}

func (Trello TrelloService) HandleSignupCallback(code string) (primitive.ObjectID, *string, error) {
	return primitive.NilObjectID, nil, errors.New("trello does not support signup")
}
